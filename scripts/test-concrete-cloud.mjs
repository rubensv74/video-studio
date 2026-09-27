import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createSecretResolver} from './lib/secret-resolver.mjs';
import {createSupabaseOperationalStore} from './lib/supabase-operational-store.mjs';
import {createRuntimeBindingsFromEnv} from './lib/runtime-bootstrap.mjs';
import {createControlPlaneService} from './lib/control-plane-service.mjs';

const calls = [];
const runs = new Map();
const audit = [];

const jsonResponse = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: {'content-type': 'application/json'},
  });

const fakeFetch = async (url, options = {}) => {
  const parsed = new URL(url);
  const headers = new Headers(options.headers ?? {});
  const method = options.method ?? 'GET';

  calls.push({
    url: parsed.toString(),
    pathname: parsed.pathname,
    search: parsed.search,
    method,
    headers: Object.fromEntries(headers.entries()),
  });

  assert.equal(headers.get('apikey'), 'supabase-runtime-secret');
  assert.equal(headers.get('authorization'), null);

  if (method === 'GET') {
    assert.equal(headers.get('accept-profile'), 'video_studio_api');
    assert.equal(headers.get('content-profile'), null);
  } else {
    assert.equal(headers.get('content-profile'), 'video_studio_api');
  }

  if (parsed.pathname === '/rest/v1/runs') {
    if (method === 'GET') {
      const rows = [...runs.values()]
        .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
        .map((row) => {
          if (parsed.searchParams.get('select') === 'id') return {id: row.id};
          return {payload: row.payload};
        });
      return jsonResponse(rows.slice(0, Number(parsed.searchParams.get('limit') ?? rows.length)));
    }

    if (method === 'POST') {
      assert.equal(parsed.searchParams.get('on_conflict'), 'id');
      assert.match(headers.get('prefer') ?? '', /resolution=merge-duplicates/);
      const [row] = JSON.parse(options.body);
      runs.set(row.id, row);
      return jsonResponse([{payload: row.payload}], 201);
    }
  }

  if (parsed.pathname === '/rest/v1/audit_events') {
    if (method === 'GET') {
      const limit = Number(parsed.searchParams.get('limit') ?? audit.length);
      return jsonResponse(
        audit
          .slice(0, limit)
          .map((row) => ({payload: row.payload})),
      );
    }

    if (method === 'POST') {
      const [row] = JSON.parse(options.body);
      audit.unshift(row);
      return jsonResponse([{payload: row.payload}], 201);
    }
  }

  return jsonResponse({error: 'fixture route not found'}, 404);
};

const secretResolver = createSecretResolver({
  env: {VIDEO_STUDIO_SUPABASE_SECRET_KEY: 'supabase-runtime-secret'},
});

const store = createSupabaseOperationalStore({
  baseUrl: 'https://fixture.supabase.co',
  secretRef: 'env:VIDEO_STUDIO_SUPABASE_SECRET_KEY',
  secretResolver,
  fetchImpl: fakeFetch,
  retry: {attempts: 1},
});

assert.deepEqual(await store.health(), {
  status: 'ok',
  provider: 'supabase',
  schema: 'video_studio_api',
});

const run = {
  id: 'cloud-run-1',
  kind: 'project',
  target: 'projects/demo-product/project.json',
  status: 'success',
  startedAt: '2026-09-27T10:00:00.000Z',
  completedAt: '2026-09-27T10:00:03.000Z',
};
await store.upsertRun(run);
assert.equal((await store.listRuns())[0].id, 'cloud-run-1');

await store.appendAudit({
  action: 'cloud.test',
  outcome: 'allowed',
  subject: 'g11',
  role: 'admin',
});
assert.equal((await store.listAudit())[0].action, 'cloud.test');

const snapshot = await store.snapshot();
assert.equal(snapshot.provider, 'supabase');
assert.equal(snapshot.runs.length, 1);
assert.equal(snapshot.audit.length, 1);
assert.equal(JSON.stringify(snapshot).includes('supabase-runtime-secret'), false);
assert.ok(calls.some((call) => call.headers['accept-profile'] === 'video_studio_api'));
assert.ok(calls.some((call) => call.headers['content-profile'] === 'video_studio_api'));
console.log('PASS Supabase PostgREST operational-store contract');
console.log('PASS Supabase custom-schema headers');
console.log('PASS Supabase secret key remains apikey-only');

const bindings = createRuntimeBindingsFromEnv({
  env: {
    VIDEO_STUDIO_PROFILE: 'production',
    VIDEO_STUDIO_WORKER_URL: 'https://worker.example.test',
    VIDEO_STUDIO_WORKER_CREDENTIAL_REF: 'env:WORKER_TOKEN',
    WORKER_TOKEN: 'worker-runtime-secret',
    VIDEO_STUDIO_STORE_PROVIDER: 'supabase',
    VIDEO_STUDIO_SUPABASE_URL: 'https://fixture.supabase.co',
    VIDEO_STUDIO_SUPABASE_SECRET_REF: 'env:VIDEO_STUDIO_SUPABASE_SECRET_KEY',
    VIDEO_STUDIO_SUPABASE_SECRET_KEY: 'supabase-runtime-secret',
  },
  fetchImpl: fakeFetch,
});
assert.equal(bindings.operationalStore.type, 'supabase-operational-store');
assert.equal(bindings.runtimeSummary.store, 'supabase-operational-store');
console.log('PASS production bootstrap selects Supabase store');

const sql = fs.readFileSync('providers/supabase/schema.sql', 'utf8').toLowerCase();
for (const expected of [
  'create schema if not exists video_studio_api',
  'alter table video_studio_api.runs enable row level security',
  'alter table video_studio_api.audit_events enable row level security',
  'revoke all on schema video_studio_api from anon',
  'revoke all on schema video_studio_api from authenticated',
  'grant usage on schema video_studio_api to service_role',
  'grant select, insert, update, delete',
]) {
  assert.ok(sql.includes(expected), `schema.sql missing security statement: ${expected}`);
}
assert.equal(/grant\s+.*\s+to\s+anon\b/i.test(sql), false);
assert.equal(/grant\s+.*\s+to\s+authenticated\b/i.test(sql), false);
console.log('PASS Supabase schema security contract');

const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
assert.equal(vercel.buildCommand, 'npm run build:control-plane');
assert.equal(vercel.outputDirectory, 'apps/control-plane/dist');
assert.ok(
  vercel.rewrites.some(
    (item) => item.source === '/(.*)' && item.destination === '/index.html',
  ),
);
console.log('PASS Vercel static Control Plane deployment pack');

const corsRoot = path.resolve('.generated/g11-cors');
fs.rmSync(corsRoot, {recursive: true, force: true});
fs.mkdirSync(corsRoot, {recursive: true});

const corsService = createControlPlaneService({
  root: process.cwd(),
  projectRoot: path.relative(process.cwd(), path.join(corsRoot, 'projects')),
  operationalStore: {
    listRuns: async () => [],
    upsertRun: async (record) => record,
    appendAudit: async (event) => event,
    listAudit: async () => [],
    snapshot: async () => ({version: 1, runs: [], audit: []}),
  },
  allowedOrigins: ['https://video-studio.vercel.app'],
});

const corsServer = http.createServer(corsService.handler);
await new Promise((resolve) => corsServer.listen(0, '127.0.0.1', resolve));

try {
  const address = corsServer.address();
  assert.ok(address && typeof address === 'object');
  const origin = `http://127.0.0.1:${address.port}`;

  const allowed = await fetch(`${origin}/api/catalog`, {
    headers: {origin: 'https://video-studio.vercel.app'},
  });
  assert.equal(allowed.status, 200);
  assert.equal(
    allowed.headers.get('access-control-allow-origin'),
    'https://video-studio.vercel.app',
  );

  const preflight = await fetch(`${origin}/api/media`, {
    method: 'OPTIONS',
    headers: {
      origin: 'https://video-studio.vercel.app',
      'access-control-request-method': 'POST',
    },
  });
  assert.equal(preflight.status, 204);
  assert.match(
    preflight.headers.get('access-control-allow-methods') ?? '',
    /POST/,
  );

  const denied = await fetch(`${origin}/api/catalog`, {
    headers: {origin: 'https://untrusted.example'},
  });
  assert.equal(denied.status, 403);
  console.log('PASS explicit Control Plane CORS allowlist');
} finally {
  await new Promise((resolve, reject) =>
    corsServer.close((error) => (error ? reject(error) : resolve())),
  );
}

console.log('PASS VS-G11 concrete cloud binding source contract');
