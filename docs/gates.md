# Delivery gates

## VS-G01 — Multi-engine foundation

**Status: VERIFIED — merged through PR #1**

## VS-G02 — First verified render

**Status: VERIFIED — merged through PR #3**

See `docs/vs-g02-evidence.md`.

## VS-G03 — Media stack

**Status: VERIFIED — merged through PR #5**

See `docs/vs-g03-evidence.md`.

## VS-G04 — Advanced visuals

**Status: VERIFIED — merged through PR #9**

See `docs/vs-g04-evidence.md`.

## VS-G05 — Productization

**Status: VERIFIED — merged through PR #11**

Verified:

- project scaffolder;
- 16:9 / 9:16 / 1:1 physical presets;
- runtime themes;
- scene registry;
- reusable transition;
- local JSON and HTTP JSON data adapters.

See `docs/vs-g05-evidence.md`.

## VS-G06 — Scale

**Status: VERIFIED — merged through PR #13**

Verified:

- versioned batch contract;
- queue validation;
- controlled concurrency;
- failure isolation;
- deterministic render fingerprints and cache keys;
- output SHA-256 cache integrity;
- independent retention/expiry metadata;
- local worker adapter;
- provider-neutral HTTP worker boundary;
- physical multi-project batch;
- 100% cache-hit replay;
- machine-readable batch reports;
- retained CI cache/report artifacts.

Reference run:

`36310223063`

Physical evidence:

```text
BATCH productization-ci: success=2 cached=0 failed=0
CACHE HIT landscape: 7b4223861246
CACHE HIT square: 3e2d32b01235
BATCH productization-ci: success=0 cached=2 failed=0
PASS first batch: success=2 cached=0
PASS second batch: success=0 cached=2
PASS VS-G06 physical batch/cache contract
```

Artifact:

- ID: `10929271152`;
- size: `14,800,874 bytes`;
- digest: `sha256:054b71cd3cbb00c94529df8a2786e5d1c8e7fa8e4a8145c9d836c215d00b6480`.

See `docs/vs-g06-evidence.md`.

## Foundation roadmap conclusion

The original **VS-G01 → VS-G06** roadmap is complete.

Capabilities beyond this point are extensions rather than prerequisites for the foundation, such as:

- concrete cloud-provider workers;
- AI asset-generation adapters;
- TTS/transcription providers;
- a browser-based render control plane;
- organization-level governance/observability.


## VS-G07 — Control Plane

**Status: VERIFIED — PR #15**

Verified:

- React/Vite Control Plane workspace;
- production UI build;
- provider-neutral Node HTTP API;
- health/capability endpoint;
- project/preset/theme/batch catalog;
- safe project scaffolding endpoint;
- safe project and batch submission contract;
- path traversal rejection;
- shell-injection-shaped target rejection;
- run/report history endpoint;
- static production serving boundary;
- existing VS-G01 through VS-G06 regression pipeline remains green.

Reference run:

`36313713092`

API evidence:

```text
PASS control-plane health
PASS control-plane catalog
PASS control-plane project scaffolding
PASS control-plane path traversal rejection
PASS control-plane shell-injection-shaped target rejection
PASS control-plane batch submission contract
PASS control-plane project render submission contract
PASS control-plane run history
PASS VS-G07 control-plane API contract
```

UI build evidence:

```text
vite v4.5.14 building for production...
✓ built in 1.27s
```

Artifact:

- ID: `10929952093`;
- size: `15,075,265 bytes`;
- digest: `sha256:665411b34252474c0d3d05d622a238511d343f87e662f249dd0c9be969b8c217`.

See `docs/vs-g07-evidence.md`.

## Extension roadmap

The verified Control Plane opens the next extension gates without changing the core manifest:

- authentication / authorization;
- concrete cloud worker providers;
- persistent operational database;
- AI asset-generation adapters;
- TTS and transcription providers;
- organization-level governance and observability.


## VS-G08 — AI Media Adapters

**Status: VERIFIED — merged through PR #20**

Verified:

- provider-neutral image-generation contract;
- provider-neutral TTS contract;
- provider-neutral transcription contract;
- deterministic local fixture provider;
- provider-neutral HTTP media-provider boundary;
- generated asset registry/history;
- neutral image tracks in the normal media stack;
- Control Plane `GET/POST /api/media`;
- Control Plane Media Lab build;
- physical Remotion render using generated image/audio/SRT assets;
- generated-media QA frame and artifact retention;
- VS-G01 through VS-G07 regressions remain green.

Reference run:

`36320838535`

Evidence:

```text
PASS deterministic image/TTS/transcription provider contracts
PASS generated asset registry
PASS provider-neutral HTTP media boundary
PASS control-plane media generation/history
PASS AI media audio stream: aac
PASS AI media QA frame: 486364 bytes
PASS VS-G08 physical AI-media integration contract
```

Artifact:

- ID: `10932552442`;
- size: `17,715,802 bytes`;
- digest: `sha256:204e045a8003add0a3795a0d3e2cbda0385c86c8a649217c8a5eea2d93fe7b6b`.

See `docs/vs-g08-evidence.md`.

## Next extension gate

The next production-oriented extension is **VS-G09 — Operational Persistence & Access**:

- persistent run/project/media metadata;
- authentication boundary;
- role-based authorization;
- audit events;
- provider credential references without secrets in manifests;
- Control Plane operational state surviving process restarts.


## VS-G09 — Operational Persistence & Access

**Status: VERIFIED — merged through PR #22**

Verified:

- atomic operational persistence;
- run records surviving store recreation;
- persistent audit history;
- viewer/operator/admin role ordering;
- explicit local-development access mode;
- runtime bearer-token access provider;
- 401 for missing/invalid credentials;
- 403 for insufficient role;
- viewer read access;
- operator mutation access;
- admin audit access;
- denied-request audit evidence;
- Control Plane bearer-token client support;
- credential-reference contract that rejects raw secret-shaped values;
- VS-G01 through VS-G08 regression pipeline remains green.

Reference run:

`36321544133`

Artifact:

- ID: `10931933770`;
- size: `17,718,017 bytes`;
- digest: `sha256:6fbe25e70ed268074b67061a17c28ebb72750085c57fcf555294e8611ef8bb4d`.

See `docs/vs-g09-evidence.md`.

## Next extension gate

**VS-G10 — External Provider Runtime**

Candidate scope:

- concrete remote render-worker adapter;
- durable external operational-store adapter;
- runtime secret resolver;
- provider health/capability discovery;
- retry/backoff/circuit-breaker policy;
- deployment profile separating local, CI and production operation.

The neutral project manifest remains unchanged.


## VS-G10 — External Provider Runtime

**Status: VERIFIED — merged through PR #24**

Verified:

- local / ci / production profiles;
- production bootstrap fail-fast;
- runtime secret-reference resolution;
- raw secret-value rejection;
- health/capability discovery;
- request timeout;
- exponential retry/backoff;
- circuit breaker with recovery;
- external render-worker contract;
- external operational-store contract;
- Control Plane runtime diagnostics;
- external render delegation;
- delegated run state persisted externally;
- CI runs under explicit `ci` profile;
- VS-G01 through VS-G09 regressions remain green.

Reference run:

`36323434885`

Artifact:

- ID: `10933161406`;
- size: `17,718,699 bytes`;
- digest: `sha256:fa306da54cc97b3965c1f4c543ba5ce941596d988886709f210579669edccbca`.

See `docs/vs-g10-evidence.md`.

## Next extension gate

**VS-G11 — Concrete Cloud Binding**

The core is ready to bind real infrastructure. A provider-specific deployment should be treated as an adapter implementation, not as a change to project manifests.

Candidate split:

- durable operational metadata: PostgreSQL/Supabase-class provider;
- Control Plane / lightweight API hosting: Vercel-class provider;
- render worker: compute environment able to run Chromium/Remotion/FFmpeg with appropriate CPU/memory/runtime limits;
- secret resolution: deployment secret store.

Creating or provisioning paid external resources requires an explicit provider/account/cost decision.
