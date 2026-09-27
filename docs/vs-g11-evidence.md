# VS-G11 — Concrete Cloud Binding Evidence

## Result

**VERIFIED**

VS-G11 binds the provider-neutral external runtime to concrete Supabase
persistence and a Vercel-hostable Control Plane UI without provisioning external
account resources automatically.

## Reference run

- Workflow: `Render demo`
- Run ID: `36324458542`
- PR: #26
- Result: PASS

## Supabase adapter

```text
PASS Supabase PostgREST operational-store contract
PASS Supabase custom-schema headers
PASS Supabase secret key remains apikey-only
PASS production bootstrap selects Supabase store
PASS Supabase schema security contract
```

The adapter uses:

- `Accept-Profile: video_studio_api` for reads;
- `Content-Profile: video_studio_api` for writes;
- runtime-resolved secret key in the `apikey` header;
- no Supabase secret in browser state, manifests or diagnostics.

## Supabase schema security

`providers/supabase/schema.sql`:

- creates `video_studio_api`;
- enables RLS on `runs` and `audit_events`;
- revokes access from PUBLIC, anon and authenticated;
- grants required operations to service_role only;
- defines indexes for operational ordering.

The schema must be added to Supabase Data API Exposed schemas when a real project
is provisioned.

## Vercel UI pack

```text
PASS Vercel static Control Plane deployment pack
vite built in 988ms
```

The root `vercel.json` builds:

```text
npm run build:control-plane
```

and publishes:

```text
apps/control-plane/dist
```

The UI can target an external API through
`VITE_CONTROL_PLANE_API_BASE_URL`.

## CORS

```text
PASS explicit Control Plane CORS allowlist
```

Cross-origin API access requires the exact browser origin to be present in
`VIDEO_STUDIO_ALLOWED_ORIGINS`.

## Artifact

- ID: `10933122498`
- Size: `17,719,391 bytes`
- Digest: `sha256:0a7df606941c4a6ba3dd36044ac10826d049e92d55263454e7629cfbaffe6670`

## Provisioning boundary

At closure, no external cloud resource has been created.

Supabase discovery found:

- organization plan: Free;
- new project quote: 0/month;
- two existing inactive projects belonging to unrelated developments.

Vercel discovery found:

- one user team;
- zero projects.

The next step is explicit provisioning/connection, not additional adapter design.
