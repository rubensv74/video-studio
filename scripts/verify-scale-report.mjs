import fs from 'node:fs';
import assert from 'node:assert/strict';

const firstFile = process.argv[2] ?? 'output/scale/batch-first.json';
const secondFile = process.argv[3] ?? 'output/scale/batch-second.json';

const first = JSON.parse(fs.readFileSync(firstFile, 'utf8'));
const second = JSON.parse(fs.readFileSync(secondFile, 'utf8'));

assert.equal(first.version, 1);
assert.equal(second.version, 1);
assert.equal(first.batchId, second.batchId);
assert.ok(first.summary.total >= 2);
assert.equal(first.summary.failed, 0);
assert.equal(first.summary.cached, 0);
assert.equal(first.summary.success, first.summary.total);
assert.ok(first.results.every((result) => result.cacheHit === false));

assert.equal(second.summary.failed, 0);
assert.equal(second.summary.success, 0);
assert.equal(second.summary.cached, second.summary.total);
assert.ok(second.results.every((result) => result.cacheHit === true));

for (const result of second.results) {
  assert.ok(result.cacheKey);
  assert.ok(result.output);
  assert.ok(result.detail?.expiresAt);
}

console.log(
  `PASS first batch: success=${first.summary.success} cached=${first.summary.cached}`,
);
console.log(
  `PASS second batch: success=${second.summary.success} cached=${second.summary.cached}`,
);
console.log('PASS VS-G06 physical batch/cache contract');
