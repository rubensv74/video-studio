import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {loadBatch, resolveBatchJobs, validateBatch} from './lib/batch-contract.mjs';
import {executeQueue} from './lib/queue-executor.mjs';
import {
  computeRendererFingerprint,
  computeRenderCacheKey,
  readRenderCache,
  writeRenderCache,
} from './lib/render-cache.mjs';
import {
  createHttpWorkerAdapter,
  createLocalWorkerAdapter,
} from './lib/worker-adapter.mjs';
import {loadProjectManifest} from './lib/manifest.mjs';

const args = process.argv.slice(2);
const batchFile = args.find((value) => !value.startsWith('--')) ?? 'batches/productization-ci.json';

const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

const reportFile = path.resolve(
  option('--report', `output/scale/${path.basename(batchFile, path.extname(batchFile))}-report.json`),
);
const clearCache = args.includes('--clear-cache');

const run = (command, commandArgs, env = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: 'inherit',
      env: {...process.env, ...env},
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });

const {batch} = loadBatch(batchFile);
const errors = validateBatch(batch);
if (errors.length) {
  errors.forEach((error) => console.error(`FAIL ${error}`));
  process.exit(1);
}

const jobs = resolveBatchJobs(batch);
const cacheDir = path.resolve(batch.cache?.directory ?? 'output/scale/cache');

if (clearCache && fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, {recursive: true, force: true});
}

const rendererFingerprint = computeRendererFingerprint();

const localExecute = async (job) => {
  if (!fs.existsSync(job.manifest)) {
    throw new Error(`manifest not found: ${job.manifest}`);
  }

  const {project} = loadProjectManifest(job.manifest);
  const outputFile = path.resolve(project.output.file);
  const cacheKey = computeRenderCacheKey(job.manifest, {rendererFingerprint});

  if (batch.cache?.enabled) {
    const hit = readRenderCache({cacheDir, key: cacheKey, outputFile});
    if (hit) {
      console.log(`CACHE HIT ${job.id}: ${cacheKey.slice(0, 12)}`);
      return {
        status: 'cached',
        cacheHit: true,
        output: outputFile,
        cacheKey,
        worker: 'local',
        detail: {expiresAt: hit.expiresAt},
      };
    }
  }

  console.log(`RENDER ${job.id}: ${job.manifest}`);
  await run(process.execPath, ['scripts/render.mjs', job.manifest]);
  await run(process.execPath, ['scripts/verify-render.mjs', job.manifest]);

  let cacheRecord = null;
  if (batch.cache?.enabled) {
    cacheRecord = writeRenderCache({
      cacheDir,
      key: cacheKey,
      jobId: job.id,
      manifestFile: job.manifest,
      outputFile,
      retentionDays: batch.retention.days,
    });
  }

  return {
    status: 'success',
    cacheHit: false,
    output: outputFile,
    cacheKey,
    worker: 'local',
    detail: cacheRecord ? {expiresAt: cacheRecord.expiresAt} : null,
  };
};

const adapter =
  batch.worker.type === 'http'
    ? createHttpWorkerAdapter({endpoint: batch.worker.endpoint})
    : createLocalWorkerAdapter({execute: localExecute});

const results = await executeQueue({
  jobs,
  concurrency: batch.concurrency,
  executeJob: async (job) => {
    if (adapter.type === 'local') return adapter.execute(job);

    const cacheKey = computeRenderCacheKey(job.manifest, {rendererFingerprint});
    return adapter.execute({
      version: 1,
      batchId: batch.id,
      jobId: job.id,
      manifest: job.manifest,
      cacheKey,
      retention: batch.retention,
    });
  },
});

const summary = {
  total: results.length,
  success: results.filter((result) => result.status === 'success').length,
  cached: results.filter((result) => result.status === 'cached').length,
  failed: results.filter((result) => result.status === 'failed').length,
};

const report = {
  version: 1,
  batchId: batch.id,
  worker: batch.worker.type,
  concurrency: batch.concurrency,
  cacheEnabled: Boolean(batch.cache?.enabled),
  cacheDirectory: cacheDir,
  retention: batch.retention,
  rendererFingerprint,
  generatedAt: new Date().toISOString(),
  summary,
  results,
};

fs.mkdirSync(path.dirname(reportFile), {recursive: true});
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');

console.log(
  `BATCH ${batch.id}: success=${summary.success} cached=${summary.cached} failed=${summary.failed}`,
);
console.log(`REPORT ${reportFile}`);

if (summary.failed > 0) process.exit(1);
