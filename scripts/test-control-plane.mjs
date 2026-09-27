import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createControlPlaneService} from './lib/control-plane-service.mjs';

const projectRoot = '.generated/control-plane-test/projects';
fs.rmSync(path.resolve('.generated/control-plane-test'), {
  recursive: true,
  force: true,
});

const service = createControlPlaneService({projectRoot});
const server = http.createServer(service.handler);

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

try {
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const base = `http://127.0.0.1:${address.port}`;

  const healthResponse = await fetch(`${base}/api/health`);
  assert.equal(healthResponse.status, 200);
  const health = await healthResponse.json();
  assert.equal(health.status, 'ok');
  assert.ok(health.capabilities.includes('render-submission'));
  console.log('PASS control-plane health');

  const catalogResponse = await fetch(`${base}/api/catalog`);
  assert.equal(catalogResponse.status, 200);
  const catalog = await catalogResponse.json();
  assert.ok(catalog.presets.some((item) => item.id === 'portrait-9x16'));
  assert.ok(catalog.themes.some((item) => item.id === 'blueprint-cyan'));
  assert.ok(catalog.batches.some((item) => item.id === 'productization-ci'));
  console.log('PASS control-plane catalog');

  const createResponse = await fetch(`${base}/api/projects`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({
      id: 'control-plane-fixture',
      title: 'Control Plane Fixture',
      preset: 'square-1x1',
      theme: 'blueprint-cyan',
    }),
  });
  assert.equal(createResponse.status, 201);
  const created = await createResponse.json();
  assert.equal(created.status, 'created');
  assert.ok(fs.existsSync(path.resolve(created.project.path)));
  console.log('PASS control-plane project scaffolding');

  const traversal = await fetch(`${base}/api/renders`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({
      kind: 'batch',
      path: '../package.json',
      dryRun: true,
    }),
  });
  assert.equal(traversal.status, 400);
  const traversalBody = await traversal.json();
  assert.match(traversalBody.error, /allowed repository scope|Only .json/);
  console.log('PASS control-plane path traversal rejection');

  const injection = await fetch(`${base}/api/renders`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({
      kind: 'batch',
      path: 'batches/productization-ci.json;echo-owned',
      dryRun: true,
    }),
  });
  assert.equal(injection.status, 400);
  console.log('PASS control-plane shell-injection-shaped target rejection');

  const batchValidation = await fetch(`${base}/api/renders`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({
      kind: 'batch',
      path: 'batches/productization-ci.json',
      dryRun: true,
    }),
  });
  assert.equal(batchValidation.status, 200);
  const validated = await batchValidation.json();
  assert.equal(validated.status, 'validated');
  assert.equal(validated.kind, 'batch');
  console.log('PASS control-plane batch submission contract');

  const projectValidation = await fetch(`${base}/api/renders`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({
      kind: 'project',
      path: `${projectRoot}/control-plane-fixture/project.json`,
      dryRun: true,
    }),
  });
  assert.equal(projectValidation.status, 200);
  console.log('PASS control-plane project render submission contract');

  const runsResponse = await fetch(`${base}/api/runs`);
  assert.equal(runsResponse.status, 200);
  const runHistory = await runsResponse.json();
  assert.ok(Array.isArray(runHistory.runs));
  console.log('PASS control-plane run history');

  console.log('PASS VS-G07 control-plane API contract');
} finally {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}
