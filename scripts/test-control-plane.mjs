import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {EventEmitter} from 'node:events';
import assert from 'node:assert/strict';
import {createControlPlaneService} from './lib/control-plane-service.mjs';

const root = path.resolve('.generated/control-plane-governance');
const projectRoot = '.generated/control-plane-governance/projects';
const stateFile = '.generated/control-plane-governance/state.json';
fs.rmSync(root, {recursive: true, force: true});

const apiKeys = {
  'viewer-key': {role: 'viewer', subject: 'viewer-ci'},
  'operator-key': {role: 'operator', subject: 'operator-ci'},
  'admin-key': {role: 'admin', subject: 'admin-ci'},
};

let spawnCount = 0;
const fakeSpawn = () => {
  spawnCount += 1;
  const child = new EventEmitter();
  setImmediate(() => child.emit('exit', 0));
  return child;
};

const authHeader = (key) => ({
  authorization: `Bearer ${key}`,
  'content-type': 'application/json',
});

const startServer = async ({authDisabled = false} = {}) => {
  const service = createControlPlaneService({
    projectRoot,
    stateFile,
    apiKeys,
    authDisabled,
    spawnImpl: fakeSpawn,
  });
  const server = http.createServer(service.handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  return {
    service,
    server,
    base: `http://127.0.0.1:${address.port}`,
  };
};

const stopServer = (server) =>
  new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );

let runtime = await startServer();

try {
  const healthResponse = await fetch(`${runtime.base}/api/health`);
  assert.equal(healthResponse.status, 200);
  const health = await healthResponse.json();
  assert.equal(health.status, 'ok');
  assert.equal(health.auth.enabled, true);
  assert.ok(health.capabilities.includes('persistent-run-history'));
  assert.ok(health.capabilities.includes('rbac'));
  console.log('PASS control-plane secure health');

  const anonymousCatalog = await fetch(`${runtime.base}/api/catalog`);
  assert.equal(anonymousCatalog.status, 401);
  console.log('PASS anonymous access rejected');

  const viewerCatalog = await fetch(`${runtime.base}/api/catalog`, {
    headers: authHeader('viewer-key'),
  });
  assert.equal(viewerCatalog.status, 200);
  const catalog = await viewerCatalog.json();
  assert.ok(catalog.presets.some((item) => item.id === 'portrait-9x16'));
  assert.ok(catalog.themes.some((item) => item.id === 'blueprint-cyan'));
  assert.ok(catalog.batches.some((item) => item.id === 'productization-ci'));
  console.log('PASS viewer catalog access');

  const viewerCreate = await fetch(`${runtime.base}/api/projects`, {
    method: 'POST',
    headers: {
      ...authHeader('viewer-key'),
      'idempotency-key': 'viewer-create-001',
    },
    body: JSON.stringify({
      id: 'forbidden-project',
      title: 'Forbidden',
      preset: 'square-1x1',
      theme: 'default-dark',
    }),
  });
  assert.equal(viewerCreate.status, 403);
  console.log('PASS viewer mutation rejected');

  const createPayload = {
    id: 'governance-fixture',
    title: 'Governance Fixture',
    preset: 'square-1x1',
    theme: 'blueprint-cyan',
  };
  const createHeaders = {
    ...authHeader('operator-key'),
    'idempotency-key': 'project-create-001',
  };

  const createResponse = await fetch(`${runtime.base}/api/projects`, {
    method: 'POST',
    headers: createHeaders,
    body: JSON.stringify(createPayload),
  });
  assert.equal(createResponse.status, 201);
  const created = await createResponse.json();
  assert.equal(created.status, 'created');
  assert.ok(fs.existsSync(path.resolve(created.project.path)));
  console.log('PASS operator project creation');

  const createReplay = await fetch(`${runtime.base}/api/projects`, {
    method: 'POST',
    headers: createHeaders,
    body: JSON.stringify(createPayload),
  });
  assert.equal(createReplay.status, 201);
  const replayBody = await createReplay.json();
  assert.equal(replayBody.idempotentReplay, true);
  assert.equal(replayBody.project.path, created.project.path);
  console.log('PASS project idempotency replay');

  const idempotencyConflict = await fetch(`${runtime.base}/api/projects`, {
    method: 'POST',
    headers: createHeaders,
    body: JSON.stringify({...createPayload, title: 'Different Request'}),
  });
  assert.equal(idempotencyConflict.status, 409);
  console.log('PASS idempotency conflict rejected');

  const traversal = await fetch(`${runtime.base}/api/renders`, {
    method: 'POST',
    headers: authHeader('operator-key'),
    body: JSON.stringify({
      kind: 'batch',
      path: '../package.json',
      dryRun: true,
    }),
  });
  assert.equal(traversal.status, 400);
  console.log('PASS path traversal rejected');

  const injection = await fetch(`${runtime.base}/api/renders`, {
    method: 'POST',
    headers: authHeader('operator-key'),
    body: JSON.stringify({
      kind: 'batch',
      path: 'batches/productization-ci.json;echo-owned',
      dryRun: true,
    }),
  });
  assert.equal(injection.status, 400);
  console.log('PASS shell-injection-shaped target rejected');

  const operatorAudit = await fetch(`${runtime.base}/api/audit`, {
    headers: authHeader('operator-key'),
  });
  assert.equal(operatorAudit.status, 403);
  console.log('PASS operator admin-only audit rejection');

  const adminAudit = await fetch(`${runtime.base}/api/audit`, {
    headers: authHeader('admin-key'),
  });
  assert.equal(adminAudit.status, 200);
  const auditBeforeRender = await adminAudit.json();
  assert.equal(
    auditBeforeRender.events.filter((event) => event.action === 'project.create').length,
    1,
  );
  console.log('PASS admin audit access and deduplicated mutation');

  const renderPayload = {
    kind: 'project',
    path: `${projectRoot}/governance-fixture/project.json`,
    dryRun: false,
  };
  const renderHeaders = {
    ...authHeader('operator-key'),
    'idempotency-key': 'render-submit-001',
  };

  const renderResponse = await fetch(`${runtime.base}/api/renders`, {
    method: 'POST',
    headers: renderHeaders,
    body: JSON.stringify(renderPayload),
  });
  assert.equal(renderResponse.status, 202);
  const renderAccepted = await renderResponse.json();
  assert.ok(renderAccepted.runId);

  await new Promise((resolve) => setTimeout(resolve, 20));

  const renderReplay = await fetch(`${runtime.base}/api/renders`, {
    method: 'POST',
    headers: renderHeaders,
    body: JSON.stringify(renderPayload),
  });
  assert.equal(renderReplay.status, 202);
  const renderReplayBody = await renderReplay.json();
  assert.equal(renderReplayBody.idempotentReplay, true);
  assert.equal(renderReplayBody.runId, renderAccepted.runId);
  assert.equal(spawnCount, 1);
  console.log('PASS render idempotency prevents duplicate execution');

  const viewerRuns = await fetch(`${runtime.base}/api/runs`, {
    headers: authHeader('viewer-key'),
  });
  assert.equal(viewerRuns.status, 200);
  const runs = await viewerRuns.json();
  const persistedRun = runs.runs.find((run) => run.id === renderAccepted.runId);
  assert.equal(persistedRun?.status, 'success');
  assert.equal(persistedRun?.requestedBy, 'operator-ci');
  console.log('PASS persistent run record');

  await stopServer(runtime.server);

  runtime = await startServer();

  const runsAfterRestart = await fetch(`${runtime.base}/api/runs`, {
    headers: authHeader('viewer-key'),
  });
  assert.equal(runsAfterRestart.status, 200);
  const restartedRuns = await runsAfterRestart.json();
  assert.ok(restartedRuns.runs.some((run) => run.id === renderAccepted.runId));
  console.log('PASS run history survives service restart');

  const auditAfterRestart = await fetch(`${runtime.base}/api/audit`, {
    headers: authHeader('admin-key'),
  });
  assert.equal(auditAfterRestart.status, 200);
  const restartedAudit = await auditAfterRestart.json();
  assert.ok(restartedAudit.events.some((event) => event.action === 'render.submit'));
  console.log('PASS audit history survives service restart');
} finally {
  await stopServer(runtime.server).catch(() => {});
}

const devRuntime = await startServer({authDisabled: true});
try {
  const devCatalog = await fetch(`${devRuntime.base}/api/catalog`);
  assert.equal(devCatalog.status, 200);
  console.log('PASS explicit local-development auth disable');
} finally {
  await stopServer(devRuntime.server);
}

console.log('PASS VS-G08 persistence and governance contract');
