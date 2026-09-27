# VS-G06 — Scale Evidence

## Result

**VERIFIED**

VS-G06 adds a provider-neutral scaling layer without changing the neutral project manifest contract.

## Reference run

- Workflow: `Render demo`
- Run ID: `36310223063`
- Branch: `program/vs-g06-scale`
- PR: #13
- Result: PASS

## Source-contract evidence

```text
PASS batch contract
PASS duplicate job validation
PASS controlled concurrency and failure isolation
PASS render cache key changes with project input
PASS cache integrity and retention metadata
PASS provider-neutral HTTP worker boundary
PASS VS-G06 scale source contract
```

## Physical batch

Batch:

```text
batches/productization-ci.json
```

The first execution starts from a cleared cache:

```text
BATCH productization-ci: success=2 cached=0 failed=0
```

The second execution uses the exact same inputs:

```text
CACHE HIT landscape: 7b4223861246
CACHE HIT square: 3e2d32b01235
BATCH productization-ci: success=0 cached=2 failed=0
```

Verifier:

```text
PASS first batch: success=2 cached=0
PASS second batch: success=0 cached=2
PASS VS-G06 physical batch/cache contract
```

## Cache integrity

A cache record is only reusable when:

1. cache key matches;
2. record has not expired;
3. output file still exists;
4. output SHA-256 equals the stored hash.

The source test mutates a cached output and confirms the cache entry is rejected.

## Cache key inputs

The deterministic fingerprint covers:

- project input directory;
- Remotion renderer source;
- shared contracts;
- design system;
- themes;
- presets;
- package lock;
- static renderer media where present.

Changing project input changes the render cache key.

## Queue behavior

The queue source test uses concurrency 2 and confirms:

- no more than two jobs execute concurrently;
- one expected job failure is isolated;
- subsequent jobs still complete;
- the report preserves per-job outcomes.

## Worker boundary

Verified adapters:

- local repository worker;
- provider-neutral HTTP worker.

The HTTP adapter is tested against an ephemeral local server so the real HTTP POST/JSON contract is exercised without binding Video Studio to a cloud vendor.

## Retention

Cache records include:

- creation time;
- expiry time;
- retention days;
- output hash;
- manifest path;
- output path.

This retention metadata is independent from GitHub Actions artifact retention.

## Artifact

- Name: `video-studio-demo`
- Artifact ID: `10929271152`
- Size: `14,800,874 bytes`
- Digest:
  `sha256:054b71cd3cbb00c94529df8a2786e5d1c8e7fa8e4a8145c9d836c215d00b6480`

The artifact retains batch reports and cache metadata in addition to regression render outputs.

## Roadmap conclusion

VS-G06 closes the original Video Studio foundation roadmap G01–G06.
