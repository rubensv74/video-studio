import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
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
import {createFixtureMediaProvider} from './media-provider.mjs';

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
      throw new Error('Request body exceeds 1 MB');
    }
  }
  return body ? JSON.parse(body) : {};
};

const isInside = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

const safeJsonPath = ({root, requested, allowedRoots}) => {
  if (typeof requested !== 'string' || !requested.endsWith('.json')) {
    throw new Error('Only .json targets are allowed');
  }

  const target = path.resolve(root, requested);
  const allowed = allowedRoots.map((item) => path.resolve(root, item));
  if (!allowed.some((base) => isInside(base, target))) {
    throw new Error('Target path is outside the allowed repository scope');
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
  mediaProvider,
} = {}) => {
  const absoluteRoot = path.resolve(root);
  const absoluteProjectRoot = path.resolve(absoluteRoot, projectRoot);
  const absoluteDist = path.resolve(absoluteRoot, distDir);
  const liveRuns = new Map();
  let runCounter = 0;
  const media =
    mediaProvider ??
    createFixtureMediaProvider({
      publicDir: path.join(absoluteRoot, 'apps/remotion-studio/public/generated-media'),
      registryFile: path.join(absoluteRoot, 'output/generated-media/registry.json'),
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
    const live = [...liveRuns.values()];
    return [...live, ...reportRuns()].sort((a, b) =>
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
      if (!fs.existsSync(file)) throw new Error('Project manifest does not exist');
      const {project} = loadProjectManifest(file);
      const errors = validateProject(project);
      if (errors.length) throw new Error(errors.join('; '));
      return file;
    }

    if (kind === 'batch') {
      const file = safeJsonPath({
        root: absoluteRoot,
        requested,
        allowedRoots: ['batches'],
      });
      if (!fs.existsSync(file)) throw new Error('Batch file does not exist');
      const {batch} = loadBatch(file);
      const errors = validateBatch(batch);
      if (errors.length) throw new Error(errors.join('; '));
      return file;
    }

    throw new Error('kind must be project or batch');
  };

  const startRun = ({kind, target}) => {
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
    };
    liveRuns.set(id, record);

    const child = spawn(process.execPath, [script, target], {
      cwd: absoluteRoot,
      stdio: 'inherit',
      shell: false,
    });

    child.on('error', (error) => {
      liveRuns.set(id, {
        ...record,
        status: 'failed',
        completedAt: new Date().toISOString(),
        error: error.message,
        exitCode: -1,
      });
    });

    child.on('exit', (code) => {
      liveRuns.set(id, {
        ...record,
        status: code === 0 ? 'success' : 'failed',
        completedAt: new Date().toISOString(),
        exitCode: code,
      });
    });

    return {id};
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
          version: 1,
          capabilities: [
            'catalog',
            'project-scaffolding',
            'render-submission',
            'batch-submission',
            'run-history',
            'cache-aware-scale-layer',
            'media-generation',
            'media-history',
          ],
        });
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/catalog') {
        json(response, 200, catalog());
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/runs') {
        json(response, 200, {runs: runs()});
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/media') {
        json(response, 200, {assets: media.listAssets?.() ?? []});
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/media') {
        const body = await readBody(request);
        let asset;

        if (body.kind === 'image') {
          asset = await media.generateImage({
            prompt: body.prompt,
            width: body.width,
            height: body.height,
          });
        } else if (body.kind === 'tts') {
          asset = await media.synthesizeSpeech({
            text: body.text,
            voice: body.voice,
          });
        } else if (body.kind === 'transcription') {
          asset = await media.transcribe({
            audioFile: body.audioFile,
            fixtureTranscript: body.fixtureTranscript,
          });
        } else {
          throw new Error('media kind must be image, tts or transcription');
        }

        json(response, 201, {status: 'created', asset});
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/projects') {
        const body = await readBody(request);
        const result = writeProject({
          id: body.id,
          title: body.title,
          preset: body.preset,
          theme: body.theme,
          outputRoot: absoluteProjectRoot,
          force: false,
        });
        json(response, 201, {
          status: 'created',
          project: {
            id: result.manifest.id,
            path: relativePosix(absoluteRoot, result.projectFile),
          },
        });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/renders') {
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

        const run = startRun({kind: body.kind, target});
        json(response, 202, {status: 'accepted', runId: run.id});
        return;
      }

      if (url.pathname.startsWith('/api/')) {
        json(response, 404, {error: 'API route not found'});
        return;
      }

      serveStatic(request, response);
    } catch (error) {
      json(response, 400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return {
    handler,
    catalog,
    runs,
    validateRenderTarget,
  };
};

export const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
