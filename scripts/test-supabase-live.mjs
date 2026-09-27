import assert from 'node:assert/strict';
import {createSecretResolver} from './lib/secret-resolver.mjs';
import {createSupabaseOperationalStore} from './lib/supabase-operational-store.mjs';

const baseUrl = process.env.VIDEO_STUDIO_SUPABASE_URL;
const secretRef =
  process.env.VIDEO_STUDIO_SUPABASE_SECRET_REF ??
  'env:VIDEO_STUDIO_SUPABASE_SECRET_KEY';
const schema =
  process.env.VIDEO_STUDIO_SUPABASE_SCHEMA ?? 'video_studio_api';

if (!baseUrl) {
  throw new Error('VIDEO_STUDIO_SUPABASE_URL is required');
}

const resolver = createSecretResolver({env: process.env});
const store = createSupabaseOperationalStore({
  baseUrl,
  secretRef,
  schema,
  secretResolver: resolver,
});

const stamp = Date.now();
const runId = `g12-http-${stamp}`;

const health = await store.health();
assert.equal(health.status, 'ok');

await store.upsertRun({
  id: runId,
  kind: 'cloud-validation',
  target: schema,
  status: 'success',
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
});

await store.appendAudit({
  action: 'g12.http-live-validation',
  outcome: 'allowed',
  subject: runId,
  role: 'service_role',
  provider: 'supabase',
});

const runs = await store.listRuns();
const audit = await store.listAudit({limit: 100});

assert.ok(runs.some((run) => run.id === runId));
assert.ok(
  audit.some(
    (event) =>
      event.action === 'g12.http-live-validation' &&
      event.subject === runId,
  ),
);

const snapshot = await store.snapshot();
assert.ok(snapshot.runs.some((run) => run.id === runId));
assert.equal(JSON.stringify(snapshot).includes('sb_secret_'), false);

console.log('PASS live Supabase PostgREST health');
console.log('PASS live Supabase run upsert/list');
console.log('PASS live Supabase audit append/list');
console.log('PASS live Supabase snapshot without secret leakage');
