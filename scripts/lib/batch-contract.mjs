import fs from 'node:fs';
import path from 'node:path';

const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const positiveInt = (value) => Number.isInteger(value) && value > 0;

export const loadBatch = (file) => {
  const fullPath = path.resolve(file);
  return {
    batch: JSON.parse(fs.readFileSync(fullPath, 'utf8')),
    fullPath,
  };
};

export const validateBatch = (batch) => {
  const errors = [];

  if (batch.version !== 1) errors.push('batch.version must be 1');
  if (!nonEmpty(batch.id)) errors.push('batch.id is required');

  if (!positiveInt(batch.concurrency) || batch.concurrency > 16) {
    errors.push('batch.concurrency must be an integer between 1 and 16');
  }

  if (batch.cache?.enabled) {
    if (!nonEmpty(batch.cache.directory)) {
      errors.push('batch.cache.directory is required when cache is enabled');
    }
  }

  if (!positiveInt(batch.retention?.days) || batch.retention.days > 3650) {
    errors.push('batch.retention.days must be an integer between 1 and 3650');
  }

  if (!['local', 'http'].includes(batch.worker?.type)) {
    errors.push('batch.worker.type must be local or http');
  }

  if (batch.worker?.type === 'http' && !/^https?:\/\//i.test(batch.worker?.endpoint ?? '')) {
    errors.push('batch.worker.endpoint must be http/https for http workers');
  }

  if (!Array.isArray(batch.jobs) || batch.jobs.length === 0) {
    errors.push('batch.jobs must contain at least one job');
  }

  const ids = new Set();
  for (const job of batch.jobs ?? []) {
    if (!nonEmpty(job.id)) errors.push('batch job id is required');
    if (ids.has(job.id)) errors.push(`batch job id must be unique: ${job.id}`);
    ids.add(job.id);
    if (!nonEmpty(job.manifest)) {
      errors.push(`batch job ${job.id || '?'} manifest is required`);
    }
  }

  return errors;
};

export const resolveBatchJobs = (batch) =>
  (batch.jobs ?? []).map((job) => ({
    ...job,
    manifest: path.resolve(job.manifest),
  }));
