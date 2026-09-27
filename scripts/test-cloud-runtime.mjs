import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker=fs.readFileSync('scripts/worker-server.mjs','utf8');
const control=fs.readFileSync('scripts/control-plane-server.mjs','utf8');
const blueprint=fs.readFileSync('render.yaml','utf8');
const docker=fs.readFileSync('Dockerfile.worker','utf8');

assert.match(control, /HOST \|\| '0\.0\.0\.0'/);
assert.match(worker, /VIDEO_STUDIO_WORKER_TOKEN/);
assert.match(worker, /authorization/);
assert.match(worker, /\/health/);
assert.match(worker, /\/capabilities/);
assert.match(worker, /\/jobs/);
assert.match(worker, /projects.*batches/s);
assert.match(blueprint, /video-studio-api/);
assert.match(blueprint, /video-studio-worker/);
assert.match(blueprint, /VIDEO_STUDIO_SUPABASE_SECRET_KEY/);
assert.match(blueprint, /envVarKey: RENDER_EXTERNAL_URL/);
assert.match(blueprint, /envVarKey: VIDEO_STUDIO_WORKER_TOKEN/);
assert.match(blueprint, /generateValue: true/);
assert.match(docker, /ffmpeg/);
assert.match(docker, /chromium/);
console.log('PASS VS-G12 cloud runtime deployment contract');
