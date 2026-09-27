import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {
  loadProjectManifest,
  validateProject,
} from './manifest.mjs';
import {
  loadBatch,
  validateBatch,
} from './batch-contract.mjs';
import {
  loadPresetCatalog,
  loadThemeCatalog,
  writeProject,
} from './scaffold.mjs';
import {createJsonControlPlaneStore} from './control-plane-store.mjs';
import {
  authenticate,
  ControlPlaneHttpError,
  normalizeApiKeys,
  requestFingerprint,
} from './control-plane-auth.mjs';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const json = (response, status, body) => {
  const content = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(content),
    'cache-control': 'no-store',
  });
  response.end(content);
};

const readBody = async (request) => {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) {
      throw new ControlPlaneHttpError(413, 'Request body exceeds 1 MB');
    }
  }

  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new ControlPlaneHttpError(400, 'Request body must be valid JSON');
  }
};

const isInside = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

const safeJsonPath = ({root, requested, allowedRoots}) => {
  if (typeof requested !== 'string' || !requested.endsWith('.json')) {
    throw new ControlPlaneHttpError(400, 'Only .json targets are allowed');
  }

  const target = path.resolve(root, requested);
  const allowed = allowedRoots.map((item) => path.resolve(root, item));
  if (!allowed.some((base) => isInside(base, target))) {
    throw new ControlPlaneHttpError(
      400,
      'Target path is outside the allowed repository scope',
    );
  }
  return target;
};

const listJsonFiles = (directory) => {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, {withFileTypes: true})
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(directory, entry.name))
    .sort();
};

const listProjectFiles = (directory) => {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(directory, entry.name, 'project.json'))
    .filter((file) => fs.existsSync(file))
    .sort();
};

const relativePosix = (root, file) =>
  path.relative(root, file).replaceAll(path.sep, '/');

export const createControlPlaneService = ({
  root = process.cwd(),
  projectRoot = 'projects',
  distDir = 'apps/control-plane/dist',
  stateFile = '.video-studio/control-plane-state.json',
  authDisabled = false,
  apiKeys = {},
  store,
  spawnImpl = spawn,
} = {}) => {
  const absoluteRoot = path.resolve(root);
  const absoluteProjectRoot = path.resolve(absoluteRoot, projectRoot);
  const absoluteDist = path.resolve(absoluteRoot, distDir);
  const stateStore =
    store ??
    createJsonControlPlaneStore({
      file: path.resolve(absoluteRoot, stateFile),
    });
  const credentials = normalizeApiKeys(apiKeys);
  let runCounter = 0;

  if (!authDisabled && credentials.size === 0) {
    throw new Error(
      'Control Plane authentication is enabled but VIDEO_STUDIO_API_KEYS is empty. Configure API keys or explicitly set VIDEO_STUDIO_AUTH_DISABLED=true for local development.',
    );
  }

  const actorFor = (request, requiredRole = 'viewer') =>
    authenticate({
      request,
      authDisabled,
      credentials,
      requiredRole,
    });

  const catalog = () => {
    const projects = listProjectFiles(absoluteProjectRoot).flatMap((file) => {
      try {
        const {project} = loadProjectManifest(file);
        return [{
          id: project.id,
          title: project.title,
          path: relativePosix(absoluteRoot, file),
          engine: project.engine,
          theme: project.theme,
          compositionId: project.compositionId,
          output: project.output,
        }];
      } catch {
        return [];
      }
    });

    const presets = Object.entries(loadPresetCatalog()).map(([id, value]) => ({
      id,
      ...value,
    }));

    const themes = Object.entries(loadThemeCatalog()).map(([id, value]) => ({
      id,
      accent: value.colors.accent,
      background: value.colors.ink,
    }));

    const batches = listJsonFiles(path.join(absoluteRoot, 'batches')).flatMap((file) => {
      try {
        const {batch} = loadBatch(file);
        return [{
          id: batch.id,
          path: relativePosix(absoluteRoot, file),
          jobs: batch.jobs?.length ?? 0,
          concurrency: batch.concurrency,
          worker: batch.worker?.type ?? 'unknown',
        }];
      } catch {
        return [];
      }
    });

    return {projects, presets, themes, batches};
  };

  const reportRuns = () =>
    listJsonFiles(path.join(absoluteRoot, 'output', 'scale'))
      .filter((file) => file.endsWith('-report.json') || file.includes('batch-'))
      .flatMap((file) => {
        try {
          const report = JSON.parse(fs.readFileSync(file, 'utf8'));
          if (!report.batchId || !report.summary) return [];
          return [{
            id: `report:${path.basename(file)}`,
            kind: 'report',
            target: report.batchId,
            status: report.summary.failed > 0 ? 'failed' : 'completed',
            completedAt: report.generatedAt,
            summary: report.summary,
          }];
        } catch {
          return [];
        }
      });

  const runs = () => {
    const persisted = stateStore.getRuns();
    return [...persisted, ...reportRuns()].sort((a, b) =>
      String(b.startedAt ?? b.completedAt ?? '').localeCompare(
        String(a.startedAt ?? a.completedAt ?? ''),
      ),
    );
  };

  const validateRenderTarget = ({kind, requested}) => {
    if (kind === 'project') {
      const file = safeJsonPath({
        root: absoluteRoot,
        requested,
        allowedRoots: [projectRoot],
      });
      if (!fs.existsSync(file)) {
        throw new ControlPlaneHttpError(400, 'Project manifest does not exist');
      }
      const {project} = loadProjectManifest(file);
      const errors = validateProject(project);
      if (errors.length) throw new ControlPlaneHttpError(400, errors.join('; '));
      return file;
    }

    if (kind === 'batch') {
      const file = safeJsonPath({
        root: absoluteRoot,
        requested,
        allowedRoots: ['batches'],
      });
      if (!fs.existsSync(file)) {
        throw new ControlPlaneHttpError(400, 'Batch file does not exist');
      }
      const {batch} = loadBatch(file);
      const errors = validateBatch(batch);
      if (errors.length) throw new ControlPlaneHttpError(400, errors.join('; '));
      return file;
    }

    throw new ControlPlaneHttpError(400, 'kind must be project or batch');
  };

  const startRun = ({kind, target, actor}) => {
    const id = `run-${Date.now()}-${++runCounter}`;
    const script = kind === 'batch' ? 'scripts/render-batch.mjs' : 'scripts/render.mjs';
    const startedAt = new Date().toISOString();

    const record = {
      id,
      kind,
      target: relativePosix(absoluteRoot, target),
      status: 'running',
      startedAt,
      exitCode: null,
      requestedBy: actor.subject,
    };
    stateStore.upsertRun(record);
    stateStore.appendAudit({
      actor: actor.subject,
      role: actor.role,
      action: 'render.submit',
      target: record.target,
      status: 'accepted',
      detail: {runId: id, kind},
    });

    const child = spawnImpl(process.execPath, [script, target], {
      cwd: absoluteRoot,
      stdio: 'inherit',
      shell: false,
    });

    child.on('error', (error) => {
      stateStore.upsertRun({
        ...record,
        status: 'failed',
        completedAt: new Date().toISOString(),
        error: error.message,
        exitCode: -1,
      });
    });

    child.on('exit', (code) => {
      stateStore.upsertRun({
        ...record,
        status: code === 0 ? 'success' : 'failed',
        completedAt: new Date().toISOString(),
        exitCode: code,
      });
    });

    return {id};
  };

  const idempotentMutation = async ({
    request,
    url,
    actor,
    body,
    operation,
  }) => {
    const key = request.headers['idempotency-key'];
    if (typeof key !== 'string' || key.trim().length < 8) {
      throw new ControlPlaneHttpError(
        400,
        'Mutating requests require an Idempotency-Key header of at least 8 characters',
      );
    }

    const fingerprint = requestFingerprint({
      method: request.method,
      pathname: url.pathname,
      body,
    });
    const scope = actor.subject;
    const existing = stateStore.getIdempotency(scope, key);

    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        throw new ControlPlaneHttpError(
          409,
          'Idempotency-Key was already used with a different request',
        );
      }
      return {
        status: existing.status,
        body: {...existing.body, idempotentReplay: true},
      };
    }

    const result = await operation();
    stateStore.putIdempotency(scope, key, {
      fingerprint,
      status: result.status,
      body: result.body,
      createdAt: new Date().toISOString(),
    });
    return result;
  };

  const serveStatic = (request, response) => {
    if (!fs.existsSync(absoluteDist)) {
      response.writeHead(404);
      response.end('Control plane UI has not been built yet.');
      return;
    }

    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    let target = path.resolve(absoluteDist, relative);

    if (!isInside(absoluteDist, target)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      target = path.join(absoluteDist, 'index.html');
    }

    const body = fs.readFileSync(target);
    response.writeHead(200, {
      'content-type': mime[path.extname(target)] ?? 'application/octet-stream',
      'content-length': body.length,
    });
    response.end(body);
  };

  const handler = async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');

    try {
      if (request.method === 'GET' && url.pathname === '/api/health') {
        json(response, 200, {
          status: 'ok',
          service: 'video-studio-control-plane',
          version: 2,
          auth: {
            enabled: !authDisabled,
            roles: ['viewer', 'operator', 'admin'],
          },
          capabilities: [
            'catalog',
            'project-scaffolding',
            'render-submission',
            'batch-submission',
            'persistent-run-history',
            'audit-log',
            'idempotency',
            'rbac',
            'cache-aware-scale-layer',
          ],
        });
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/catalog') {
        actorFor(request, 'viewer');
        json(response, 200, catalog());
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/runs') {
        actorFor(request, 'viewer');
        json(response, 200, {runs: runs()});
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/audit') {
        actorFor(request, 'admin');
        const limit = Number(url.searchParams.get('limit') ?? 200);
        json(response, 200, {events: stateStore.getAudit({limit})});
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/projects') {
        const actor = actorFor(request, 'operator');
        const body = await readBody(request);
        const result = await idempotentMutation({
          request,
          url,
          actor,
          body,
          operation: async () => {
            const created = writeProject({
              id: body.id,
              title: body.title,
              preset: body.preset,
              theme: body.theme,
              outputRoot: absoluteProjectRoot,
              force: false,
            });
            const responseBody = {
              status: 'created',
              project: {
                id: created.manifest.id,
                path: relativePosix(absoluteRoot, created.projectFile),
              },
            };
            stateStore.appendAudit({
              actor: actor.subject,
              role: actor.role,
              action: 'project.create',
              target: responseBody.project.path,
              status: 'created',
              detail: {
                projectId: created.manifest.id,
                preset: body.preset,
                theme: body.theme,
              },
            });
            return {status: 201, body: responseBody};
          },
        });
        json(response, result.status, result.body);
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/renders') {
        const actor = actorFor(request, 'operator');
        const body = await readBody(request);
        const target = validateRenderTarget({
          kind: body.kind,
          requested: body.path,
        });

        if (body.dryRun === true) {
          json(response, 200, {
            status: 'validated',
            kind: body.kind,
            target: relativePosix(absoluteRoot, target),
          });
          return;
        }

        const result = await idempotentMutation({
          request,
          url,
          actor,
          body,
          operation: async () => {
            const run = startRun({kind: body.kind, target, actor});
            return {
              status: 202,
              body: {status: 'accepted', runId: run.id},
            };
          },
        });
        json(response, result.status, result.body);
        return;
      }

      if (url.pathname.startsWith('/api/')) {
        json(response, 404, {error: 'API route not found'});
        return;
      }

      serveStatic(request, response);
    } catch (error) {
      json(response, error?.status ?? 400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return {
    handler,
    catalog,
    runs,
    validateRenderTarget,
    store: stateStore,
  };
};
