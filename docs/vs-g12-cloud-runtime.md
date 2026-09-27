# VS-G12 — Cloud Runtime Deployment

## Status

IMPLEMENTED IN BRANCH — deployment validation pending.

## Architecture

Vercel hosts the static Control Plane UI. A separately hosted Control Plane API uses Supabase for durable operational state and delegates render submissions to an authenticated HTTP worker. The worker executes the existing Remotion/batch scripts and includes FFmpeg/Chromium in its container image.

## Security boundaries

- Supabase secret/service-role material is server-side only.
- The worker requires an exact Bearer token for capabilities and job submission.
- Worker targets are restricted to JSON files under `projects/` or `batches/`.
- The Control Plane CORS allowlist is configured from `VIDEO_STUDIO_ALLOWED_ORIGINS`.
- No provider secret belongs in `VITE_*` variables.

## Render deployment

`render.yaml` declares two free web services:

1. `video-studio-api` — Node Control Plane API.
2. `video-studio-worker` — Docker render worker.

Secrets and provider URLs use `sync: false` and must be supplied in the Render dashboard.

## Closure gate

VS-G12 is not VERIFIED until both services are deployed and the following pass against real URLs:

- `GET /api/health`;
- authenticated `GET /api/runtime`;
- worker `GET /health`;
- authenticated worker `GET /capabilities`;
- render submission returns HTTP 202;
- run/audit state persists through Supabase;
- Vercel UI calls only the Control Plane API and receives no server-side secret.
