# External Runtime

## Profiles

### local

Local render execution and local operational persistence.

### ci

Provider-independent deterministic verification. GitHub Actions explicitly sets:

```text
VIDEO_STUDIO_PROFILE=ci
```

### production

Production requires external worker and external operational store bindings. Startup fails fast when required configuration is missing.

## Runtime environment

```text
VIDEO_STUDIO_PROFILE=production
VIDEO_STUDIO_WORKER_URL=https://worker.example.com
VIDEO_STUDIO_WORKER_CREDENTIAL_REF=env:VIDEO_STUDIO_WORKER_TOKEN
VIDEO_STUDIO_STORE_URL=https://store.example.com
VIDEO_STUDIO_STORE_CREDENTIAL_REF=env:VIDEO_STUDIO_STORE_TOKEN
```

Secret values themselves are supplied only by trusted runtime infrastructure.

## Worker protocol

Required endpoints:

- `GET /health`;
- `GET /capabilities`;
- `POST /jobs`.

## Operational-store protocol

Required endpoints:

- `GET /health`;
- `GET /runs`;
- `PUT /runs/:id`;
- `GET /audit`;
- `POST /audit`;
- `GET /snapshot`.

## Resilience

Remote calls are protected by:

- bounded timeout;
- retry with exponential backoff;
- retry only for transient/network/5xx conditions;
- circuit breaker;
- half-open recovery.

## Diagnostics

`GET /api/runtime` returns provider status and circuit state. It must never return resolved secret values.

## Provider binding rule

A concrete cloud provider implements these boundaries. Provider SDK/API specifics must not leak into `project.json`.
