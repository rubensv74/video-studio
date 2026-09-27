import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {
  createStaticTokenAccessProvider,
  hasRole,
  requireRole,
  validateCredentialRef,
} from './lib/access-control.mjs';
import {createOperationalStore} from './lib/operational-store.mjs';
import {createControlPlaneService} from './lib/control-plane-service.mjs';

const root = path.resolve('.generated/operations-access-test');
fs.rmSync(root, {recursive: true, force: true});
fs.mkdirSync(root, {recursive: true});

const storeFile = path.join(root, 'operations.json');
const store = createOperationalStore({file: storeFile});
store.upsertRun({
  id: 'persisted-run',
  kind: 'project',
  target: 'projects/demo-product/project.json',
  status: 'success',
  startedAt: '2026-09-27T00:00:00.000Z',
  completedAt: '2026-09-27T00:00:01.000Z',
});
store.appendAudit({
  action: 'test.seed',
  outcome: 'allowed',
  subject: 'test',
  role: 'admin',
});

const recreated = createOperationalStore({file: storeFile});
assert.equal(recreated.listRuns()[0].id, 'persisted-run');
assert.equal(recreated.listAudit()[0].action, 'test.seed');
console.log('PASS operational store survives recreation');
console.log('PASS audit events persist');

assert.equal(hasRole({role: 'viewer'}, 'viewer'), true);
assert.equal(hasRole({role: 'viewer'}, 'operator'), false);
assert.equal(hasRole({role: 'operator'}, 'viewer'), true);
assert.equal(hasRole({role: 'operator'}, 'admin'), false);
assert.equal(hasRole({role: 'admin'}, 'operator'), true);
assert.throws(() => requireRole({role: 'viewer'}, 'operator'), /operator/);
console.log('PASS viewer/operator/admin role ordering');

assert.equal(validateCredentialRef('env:VIDEO_STUDIO_MEDIA_TOKEN'), true);
assert.equal(validateCredentialRef('secret:media/provider-token'), true);
assert.equal(validateCredentialRef('sk-live-real-secret-value'), false);
assert.equal(validateCredentialRef('https://example.com?token=secret'), false);
console.log('PASS credential-reference contract rejects secret-shaped values');

const accessProvider = createStaticTokenAccessProvider({
  tokens: {
    'viewer-token': {subject: 'viewer@example.test', role: 'viewer'},
    'operator-token': {subject: 'operator@example.test', role: 'operator'},
    'admin-token': {subject: 'admin@example.test', role: 'admin'},
  },
});

const mediaAssets = [];
const mediaProvider = {
  listAssets: () => mediaAssets,
  generateImage: async (request) => {
    const asset = {id: 'secured-image', kind: 'image', provider: 'test', request};
    mediaAssets.unshift(asset);
    return asset;
  },
  synthesizeSpeech: async () => ({id: 'secured-tts', kind: 'tts'}),
  transcribe: async () => ({id: 'secured-transcript', kind: 'transcription'}),
};

const projectRoot = path.join(root, 'projects');
const service = createControlPlaneService({
  projectRoot,
  mediaProvider,
  accessProvider,
  operationalStore: recreated,
});
const server = http.createServer(service.handler);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

const auth = (token) => ({
  authorization: `Bearer ${token}`,
  'content-type': 'application/json',
});

try {
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const base = `http://127.0.0.1:${address.port}`;

  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);

  const missing = await fetch(`${base}/api/catalog`);
  assert.equal(missing.status, 401);
  console.log('PASS protected API rejects missing credentials');

  const invalid = await fetch(`${base}/api/catalog`, {
    headers: auth('invalid-token'),
  });
  assert.equal(invalid.status, 401);
  console.log('PASS protected API rejects invalid credentials');

  const viewerRead = await fetch(`${base}/api/catalog`, {
    headers: auth('viewer-token'),
  });
  assert.equal(viewerRead.status, 200);
  console.log('PASS viewer read access');

  const viewerWrite = await fetch(`${base}/api/media`, {
    method: 'POST',
    headers: auth('viewer-token'),
    body: JSON.stringify({kind: 'image', prompt: 'forbidden'}),
  });
  assert.equal(viewerWrite.status, 403);
  console.log('PASS viewer mutation rejected');

  const operatorWrite = await fetch(`${base}/api/media`, {
    method: 'POST',
    headers: auth('operator-token'),
    body: JSON.stringify({kind: 'image', prompt: 'allowed'}),
  });
  assert.equal(operatorWrite.status, 201);
  console.log('PASS operator mutation access');

  const operatorAudit = await fetch(`${base}/api/audit`, {
    headers: auth('operator-token'),
  });
  assert.equal(operatorAudit.status, 403);

  const adminAudit = await fetch(`${base}/api/audit`, {
    headers: auth('admin-token'),
  });
  assert.equal(adminAudit.status, 200);
  const auditBody = await adminAudit.json();
  assert.ok(auditBody.events.some((event) => event.outcome === 'denied'));
  assert.ok(auditBody.events.some((event) => event.outcome === 'allowed'));
  console.log('PASS admin audit access and denied-request evidence');
} finally {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

const afterRestart = createOperationalStore({file: storeFile});
assert.ok(afterRestart.listAudit().length >= 3);
console.log('PASS operational audit survives service restart');
console.log('PASS VS-G09 operational persistence/access source contract');
