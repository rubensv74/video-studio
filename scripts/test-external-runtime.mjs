import http from 'node:http';
import assert from 'node:assert/strict';
import {getRuntimeProfile, listRuntimeProfiles} from './lib/runtime-profile.mjs';
import {createSecretResolver} from './lib/secret-resolver.mjs';
import {CircuitBreaker, fetchWithTimeout, withRetry} from './lib/resilience.mjs';
import {
  createExternalOperationalStore,
  createExternalWorkerRuntime,
  createRuntimeDiagnostics,
} from './lib/external-runtime-adapter.mjs';
import {createControlPlaneService} from './lib/control-plane-service.mjs';

assert.equal(getRuntimeProfile({env: {VIDEO_STUDIO_PROFILE: 'local'}}).id, 'local');
assert.equal(getRuntimeProfile({env: {VIDEO_STUDIO_PROFILE: 'ci'}}).id, 'ci');
assert.equal(
  getRuntimeProfile({env: {VIDEO_STUDIO_PROFILE: 'production'}}).production,
  true,
);
assert.throws(
  () => getRuntimeProfile({env: {VIDEO_STUDIO_PROFILE: 'unknown'}}),
  /Unsupported runtime profile/,
);
assert.equal(listRuntimeProfiles().length, 3);
console.log('PASS local/ci/production deployment profiles');

const secretResolver = createSecretResolver({
  env: {WORKER_TOKEN: 'runtime-worker-token'},
  secretProvider: {
    resolve: async (key) => (key === 'store/token' ? 'runtime-store-token' : null),
  },
});
assert.equal(
  await secretResolver.resolve('env:WORKER_TOKEN'),
  'runtime-worker-token',
);
assert.equal(
  await secretResolver.resolve('secret:store/token'),
  'runtime-store-token',
);
await assert.rejects(
  () => secretResolver.resolve('raw-secret-value'),
  /credential reference/,
);
console.log('PASS trusted runtime secret-reference resolver');

let retryCalls = 0;
const retrySleeps = [];
const retried = await withRetry(
  async () => {
    retryCalls += 1;
    if (retryCalls < 3) {
      const error = new Error('temporary');
      error.statusCode = 503;
      throw error;
    }
    return 'ok';
  },
  {
    attempts: 3,
    baseDelayMs: 5,
    maxDelayMs: 50,
    sleep: async (ms) => retrySleeps.push(ms),
  },
);
assert.equal(retried, 'ok');
assert.equal(retryCalls, 3);
assert.deepEqual(retrySleeps, [5, 10]);
console.log('PASS exponential retry/backoff');

let now = 1_000;
const breaker = new CircuitBreaker({
  failureThreshold: 2,
  resetTimeoutMs: 100,
  now: () => now,
});
await assert.rejects(() => breaker.execute(async () => { throw new Error('one'); }));
await assert.rejects(() => breaker.execute(async () => { throw new Error('two'); }));
assert.equal(breaker.status().state, 'open');
await assert.rejects(() => breaker.execute(async () => 'no'), /Circuit breaker is open/);
now += 101;
assert.equal(breaker.status().state, 'half-open');
assert.equal(await breaker.execute(async () => 'recovered'), 'recovered');
assert.equal(breaker.status().state, 'closed');
console.log('PASS circuit breaker opens and recovers');

const timeoutServer = http.createServer((_request, response) => {
  setTimeout(() => {
    if (!response.headersSent) {
      response.writeHead(200, {'content-type': 'application/json'});
      response.end(JSON.stringify({ok: true}));
    }
  }, 80);
});
await new Promise((resolve) => timeoutServer.listen(0, '127.0.0.1', resolve));
try {
  const address = timeoutServer.address();
  assert.ok(address && typeof address === 'object');
  await assert.rejects(
    () =>
      fetchWithTimeout(
        fetch,
        `http://127.0.0.1:${address.port}/slow`,
        {},
        10,
      ),
    /timed out/,
  );
  console.log('PASS runtime request timeout');
} finally {
  await new Promise((resolve, reject) =>
    timeoutServer.close((error) => (error ? reject(error) : resolve())),
  );
}

const state = {
  workerHealthCalls: 0,
  workerJobCalls: 0,
  runs: new Map(),
  audit: [],
};

const providerServer = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const authorization = request.headers.authorization;
  const isWorker = url.pathname.startsWith('/worker');
  const expected = isWorker
    ? 'Bearer runtime-worker-token'
    : 'Bearer runtime-store-token';

  if (authorization !== expected) {
    response.writeHead(401, {'content-type': 'application/json'});
    response.end(JSON.stringify({error: 'unauthorized'}));
    return;
  }

  if (url.pathname === '/worker/health') {
    state.workerHealthCalls += 1;
    if (state.workerHealthCalls < 3) {
      response.writeHead(503, {'content-type': 'application/json'});
      response.end(JSON.stringify({error: 'warming'}));
      return;
    }
    response.writeHead(200, {'content-type': 'application/json'});
    response.end(JSON.stringify({status: 'ok', provider: 'fixture-worker'}));
    return;
  }

  if (url.pathname === '/worker/capabilities') {
    response.writeHead(200, {'content-type': 'application/json'});
    response.end(JSON.stringify({render: true, batch: true, cache: true}));
    return;
  }

  if (url.pathname === '/worker/jobs' && request.method === 'POST') {
    state.workerJobCalls += 1;
    let body = '';
    for await (const chunk of request) body += chunk;
    const payload = JSON.parse(body);
    response.writeHead(202, {'content-type': 'application/json'});
    response.end(JSON.stringify({
      status: 'accepted',
      provider: 'fixture-worker',
      jobId: `remote-${payload.jobId}`,
    }));
    return;
  }

  if (url.pathname === '/store/health') {
    response.writeHead(200, {'content-type': 'application/json'});
    response.end(JSON.stringify({status: 'ok', provider: 'fixture-store'}));
    return;
  }

  if (url.pathname === '/store/runs' && request.method === 'GET') {
    response.writeHead(200, {'content-type': 'application/json'});
    response.end(JSON.stringify({runs: [...state.runs.values()]}));
    return;
  }

  if (url.pathname.startsWith('/store/runs/') && request.method === 'PUT') {
    let body = '';
    for await (const chunk of request) body += chunk;
    const record = JSON.parse(body);
    state.runs.set(record.id, record);
    response.writeHead(200, {'content-type': 'application/json'});
    response.end(JSON.stringify({status: 'stored', run: record}));
    return;
  }

  if (url.pathname === '/store/audit' && request.method === 'POST') {
    let body = '';
    for await (const chunk of request) body += chunk;
    const event = JSON.parse(body);
    state.audit.unshift(event);
    response.writeHead(201, {'content-type': 'application/json'});
    response.end(JSON.stringify({status: 'stored', event}));
    return;
  }

  if (url.pathname === '/store/audit' && request.method === 'GET') {
    const limit = Number(url.searchParams.get('limit') ?? 100);
    response.writeHead(200, {'content-type': 'application/json'});
    response.end(JSON.stringify({events: state.audit.slice(0, limit)}));
    return;
  }

  if (url.pathname === '/store/snapshot') {
    response.writeHead(200, {'content-type': 'application/json'});
    response.end(JSON.stringify({
      version: 1,
      runs: [...state.runs.values()],
      audit: state.audit,
    }));
    return;
  }

  response.writeHead(404, {'content-type': 'application/json'});
  response.end(JSON.stringify({error: 'not found'}));
});

await new Promise((resolve) => providerServer.listen(0, '127.0.0.1', resolve));

try {
  const address = providerServer.address();
  assert.ok(address && typeof address === 'object');
  const origin = `http://127.0.0.1:${address.port}`;
  const noWait = async () => {};

  const worker = createExternalWorkerRuntime({
    baseUrl: `${origin}/worker`,
    credentialRef: 'env:WORKER_TOKEN',
    secretResolver,
    retry: {attempts: 3, baseDelayMs: 1, sleep: noWait},
  });

  const health = await worker.health();
  assert.equal(health.status, 'ok');
  assert.equal(state.workerHealthCalls, 3);
  const capabilities = await worker.capabilities();
  assert.equal(capabilities.render, true);
  const submitted = await worker.submit({jobId: 'g10'});
  assert.equal(submitted.status, 'accepted');
  assert.equal(submitted.jobId, 'remote-g10');
  console.log('PASS external worker health/capabilities/job submission');
  console.log('PASS worker retry policy against transient 503 responses');

  const store = createExternalOperationalStore({
    baseUrl: `${origin}/store`,
    credentialRef: 'secret:store/token',
    secretResolver,
    retry: {attempts: 2, baseDelayMs: 1, sleep: noWait},
  });

  assert.equal((await store.health()).status, 'ok');
  await store.upsertRun({
    id: 'external-run',
    kind: 'project',
    target: 'projects/demo-product/project.json',
    status: 'success',
  });
  await store.appendAudit({
    action: 'external.test',
    outcome: 'allowed',
    subject: 'g10',
    role: 'admin',
  });
  assert.equal((await store.listRuns())[0].id, 'external-run');
  assert.equal((await store.listAudit())[0].action, 'external.test');
  const snapshot = await store.snapshot();
  assert.equal(snapshot.runs.length, 1);
  assert.equal(snapshot.audit.length, 1);
  console.log('PASS external operational-store adapter contract');

  const productionProfile = getRuntimeProfile({
    env: {VIDEO_STUDIO_PROFILE: 'production'},
  });
  const diagnostics = createRuntimeDiagnostics({
    profile: productionProfile,
    workerRuntime: worker,
    operationalStore: store,
  });
  const observed = await diagnostics.inspect();
  assert.equal(observed.profile, 'production');
  assert.equal(observed.production, true);
  assert.equal(observed.services.worker.status, 'available');
  assert.equal(observed.services.store.status, 'available');
  assert.equal(JSON.stringify(observed).includes('runtime-worker-token'), false);
  assert.equal(JSON.stringify(observed).includes('runtime-store-token'), false);
  console.log('PASS provider runtime diagnostics without secret leakage');

  const controlPlane = createControlPlaneService({
    operationalStore: store,
    workerRuntime: worker,
    runtimeProfile: productionProfile,
    runtimeDiagnosticsProvider: diagnostics,
  });
  const controlServer = http.createServer(controlPlane.handler);
  await new Promise((resolve) => controlServer.listen(0, '127.0.0.1', resolve));

  try {
    const controlAddress = controlServer.address();
    assert.ok(controlAddress && typeof controlAddress === 'object');
    const controlOrigin = `http://127.0.0.1:${controlAddress.port}`;

    const runtimeResponse = await fetch(`${controlOrigin}/api/runtime`);
    assert.equal(runtimeResponse.status, 200);
    const runtimeBody = await runtimeResponse.json();
    assert.equal(runtimeBody.profile, 'production');
    assert.equal(runtimeBody.services.worker.status, 'available');
    assert.equal(runtimeBody.services.store.status, 'available');
    assert.equal(JSON.stringify(runtimeBody).includes('runtime-worker-token'), false);
    console.log('PASS Control Plane runtime diagnostics endpoint');

    const renderResponse = await fetch(`${controlOrigin}/api/renders`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        kind: 'project',
        path: 'projects/demo-product/project.json',
        dryRun: false,
      }),
    });
    assert.equal(renderResponse.status, 202);
    const renderBody = await renderResponse.json();
    assert.equal(renderBody.delegated, true);
    assert.ok(String(renderBody.providerRunId).startsWith('remote-'));
    assert.ok(
      [...state.runs.values()].some(
        (run) => run.id === renderBody.runId && run.worker === 'external-http-worker',
      ),
    );
    console.log('PASS Control Plane delegates render to external worker');
    console.log('PASS external operational store receives delegated run state');
  } finally {
    await new Promise((resolve, reject) =>
      controlServer.close((error) => (error ? reject(error) : resolve())),
    );
  }
} finally {
  await new Promise((resolve, reject) =>
    providerServer.close((error) => (error ? reject(error) : resolve())),
  );
}

console.log('PASS VS-G10 external provider runtime source contract');
