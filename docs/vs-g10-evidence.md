# VS-G10 — External Provider Runtime Evidence

## Result

**VERIFIED**

VS-G10 proves that Video Studio can move from local/CI execution to provider-hosted worker and persistence services without changing the neutral project manifest.

## Reference run

- Workflow: `Render demo`
- Run ID: `36323434885`
- PR: #24
- Result: PASS
- CI runtime profile: `ci`

## Deployment profiles

```text
PASS local/ci/production deployment profiles
PASS environment-driven runtime bootstrap and production fail-fast
```

The production profile requires external worker/store URLs and credential references. Local and CI remain provider-independent.

## Secret boundary

```text
PASS trusted runtime secret-reference resolver
```

Supported references:

- `env:VARIABLE_NAME`;
- `secret:path/name` when a trusted external secret provider is injected.

Raw secret values are rejected.

## Resilience

```text
PASS exponential retry/backoff
PASS circuit breaker opens and recovers
PASS runtime request timeout
PASS worker retry policy against transient 503 responses
```

## Worker runtime

```text
PASS external worker health/capabilities/job submission
PASS Control Plane delegates render to external worker
```

The worker adapter exposes health, capabilities and job submission over HTTP.

## Operational store

```text
PASS external operational-store adapter contract
PASS external operational store receives delegated run state
```

The external store contract covers runs, audit events and snapshots.

## Diagnostics

```text
PASS provider runtime diagnostics without secret leakage
PASS Control Plane runtime diagnostics endpoint
```

The browser UI displays runtime profile and worker/store state without receiving provider secrets.

## Regression

The complete G01–G09 render/control-plane pipeline remained green.

## Artifact

- ID: `10933161406`
- Size: `17,718,699 bytes`
- Digest: `sha256:fa306da54cc97b3965c1f4c543ba5ce941596d988886709f210579669edccbca`
