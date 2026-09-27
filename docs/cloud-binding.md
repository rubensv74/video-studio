# Concrete Cloud Binding

## Current provider split

Video Studio keeps cloud concerns outside project manifests.

| Responsibility | Concrete binding | State |
|---|---|---|
| Control Plane UI | Vercel static/Vite deployment | Repository-ready |
| Operational runs/audit | Supabase Postgres + Data API | Repository-ready |
| Render worker | External HTTP worker contract | Provider not selected |
| Provider secrets | Runtime secret references | Verified |

## Supabase

The concrete store adapter uses PostgREST directly and does not add a Supabase
client dependency to the renderer.

Expected runtime variables:

```text
VIDEO_STUDIO_STORE_PROVIDER=supabase
VIDEO_STUDIO_SUPABASE_URL=https://<project-ref>.supabase.co
VIDEO_STUDIO_SUPABASE_SECRET_REF=env:VIDEO_STUDIO_SUPABASE_SECRET_KEY
VIDEO_STUDIO_SUPABASE_SCHEMA=video_studio_api
VIDEO_STUDIO_SUPABASE_SECRET_KEY=<runtime-only sb_secret key>
```

The secret key is sent only in the `apikey` request header. It is never exposed
to the browser.

### Database setup

Apply `providers/supabase/schema.sql`, then add `video_studio_api` to the
Supabase Data API **Exposed schemas** setting.

The schema:

- enables RLS on every exposed table;
- revokes schema/table/sequence access from `PUBLIC`, `anon` and
  `authenticated`;
- grants the required server-side permissions only to `service_role`;
- stores complete run/audit records as JSONB while indexing operational sort
  fields.

## Vercel

The repository root contains `vercel.json` configured to build only the Vite
Control Plane UI:

```text
build: npm run build:control-plane
output: apps/control-plane/dist
```

The browser calls a separately deployed Control Plane backend through:

```text
VITE_CONTROL_PLANE_API_BASE_URL=https://control-plane-api.example.com
```

This is deliberate: Vercel hosts the product UI, while Remotion/FFmpeg and
durable operational state remain behind the G10 external-runtime boundary.

The backend must allow the deployed Vercel origin with:

```text
VIDEO_STUDIO_ALLOWED_ORIGINS=https://<your-vercel-domain>
```

## Provisioning boundary

No Supabase project or Vercel project is created by repository code.

External provisioning is a separate authorized step because it creates
account-level resources even when the quoted monetary cost is zero.
