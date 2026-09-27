import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {loadBatch, validateBatch} from './lib/batch-contract.mjs';
import {executeQueue} from './lib/queue-executor.mjs';
import {
  computeRendererFingerprint,
  computeRenderCacheKey,
  readRenderCache,
  writeRenderCache,
} from './lib/render-cache.mjs';
import {createHttpWorkerAdapter} from './lib/worker-adapter.mjs';

const {batch} = loadBatch('batches/productization-ci.json');
assert.deepEqual(validateBatch(batch), []);
console.log('PASS batch contract');

const duplicate = {
  ...batch,
  jobs: [
    {id: 'same', manifest: 'a.json'},
    {id: 'same', manifest: 'b.json'},
  ],
};
assert.ok(validateBatch(duplicate).some((error) => error.includes('unique')));
console.log('PASS duplicate job validation');

let active = 0;
let maxActive = 0;
const fakeJobs = ['a', 'b', 'c', 'd'].map((id) => ({id}));
const queueResults = await executeQueue({
  jobs: fakeJobs,
  concurrency: 2,
  executeJob: async (job) => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 25));
    active -= 1;
    if (job.id === 'c') throw new Error('expected isolated failure');
    return {status: 'success', worker: 'test'};
  },
});

assert.equal(maxActive, 2);
assert.equal(queueResults.filter((result) => result.status === 'success').length, 3);
assert.equal(queueResults.filter((result) => result.status === 'failed').length, 1);
assert.equal(queueResults.find((result) => result.jobId === 'd')?.status, 'success');
console.log('PASS controlled concurrency and failure isolation');

const rendererFingerprint = computeRendererFingerprint();
const tempDir = path.resolve('.generated/scale-test');
fs.rmSync(tempDir, {recursive: true, force: true});
fs.mkdirSync(tempDir, {recursive: true});

const sourceManifest = path.resolve(
  '.generated/productization/generated-landscape-16x9/project.json',
);
assert.ok(fs.existsSync(sourceManifest), 'productization fixture must exist before scale test');

const tempManifest = path.join(tempDir, 'project.json');
const original = JSON.parse(fs.readFileSync(sourceManifest, 'utf8'));
fs.writeFileSync(tempManifest, JSON.stringify(original, null, 2) + '\n');
const key1 = computeRenderCacheKey(tempManifest, {rendererFingerprint});

const changed = {...original, title: `${original.title} changed`};
fs.writeFileSync(tempManifest, JSON.stringify(changed, null, 2) + '\n');
const key2 = computeRenderCacheKey(tempManifest, {rendererFingerprint});
assert.notEqual(key1, key2);
console.log('PASS render cache key changes with project input');

const outputFile = path.join(tempDir, 'output.bin');
fs.writeFileSync(outputFile, 'first-output');
const cacheDir = path.join(tempDir, 'cache');
const record = writeRenderCache({
  cacheDir,
  key: key2,
  jobId: 'cache-test',
  manifestFile: tempManifest,
  outputFile,
  retentionDays: 30,
});

assert.equal(record.retentionDays, 30);
assert.ok(Date.parse(record.expiresAt) > Date.parse(record.createdAt));
assert.ok(readRenderCache({cacheDir, key: key2, outputFile}));
fs.writeFileSync(outputFile, 'mutated-output');
assert.equal(readRenderCache({cacheDir, key: key2, outputFile}), null);
console.log('PASS cache integrity and retention metadata');

const server = http.createServer((request, response) => {
  if (request.method !== 'POST' || request.url !== '/worker') {
    response.writeHead(404).end();
    return;
  }

  let body = '';
  request.setEncoding('utf8');
  request.on('data', (chunk) => (body += chunk));
  request.on('end', () => {
    const payload = JSON.parse(body);
    response.writeHead(200, {'content-type': 'application/json'});
    response.end(
      JSON.stringify({
        status: 'success',
        cacheHit: false,
        worker: 'http-test',
        output: `external://${payload.jobId}`,
      }),
    );
  });
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const adapter = createHttpWorkerAdapter({
    endpoint: `http://127.0.0.1:${address.port}/worker`,
  });
  const result = await adapter.execute({jobId: 'external-boundary'});
  assert.equal(result.status, 'success');
  assert.equal(result.worker, 'http-test');
  assert.equal(result.output, 'external://external-boundary');
  console.log('PASS provider-neutral HTTP worker boundary');
} finally {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

console.log('PASS VS-G06 scale source contract');
