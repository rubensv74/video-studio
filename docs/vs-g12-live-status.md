# VS-G12 — Cloud Provisioning & Live Validation Status

## Current status

**IN PROGRESS — Supabase live, Vercel provisioning blocked by connector runtime**

## Supabase resource

A dedicated Supabase project was created after explicit user approval.

- Name: `Video Studio`
- Project ref: `fnosbphwdteamqfyfcry`
- Region: `eu-west-1`
- Plan context at creation: Free
- Quoted project cost: `0/month`
- Status: `ACTIVE_HEALTHY`
- Project URL: `https://fnosbphwdteamqfyfcry.supabase.co`

No existing project from another development was reused.

## Live database deployment

Applied:

- `providers/supabase/schema.sql`;
- dedicated `video_studio_api` schema;
- `runs`;
- `audit_events`;
- indexes;
- RLS;
- explicit deny policies for anon/authenticated;
- explicit service_role grants;
- custom PostgREST schema exposure.

PostgREST configuration observed:

```text
pgrst.db_schemas=public, video_studio_api
```

## Security verification

Observed privileges:

```text
anon schema usage            = false
authenticated schema usage   = false
service_role schema usage    = true

anon SELECT                  = false
authenticated SELECT         = false
service_role SELECT          = true

RLS enabled                  = true
```

After explicit deny policies were added, Supabase security advisors returned:

```text
lints: []
```

## Performance advisor

Two informational findings remain:

- `runs_updated_at_idx` unused;
- `audit_events_created_at_idx` unused.

This is expected for a newly provisioned database with essentially no workload.
The indexes are retained because the application contract orders run/audit
history by those columns.

## Live persistence verification

A real service-role validation transaction wrote and read:

```text
run id:      g12-live-validation
run_count:   1
audit_count: 1
run_status:  success
```

This validates the database-side service-role persistence model.

## Pending live PostgREST adapter verification

The ChatGPT Supabase connector intentionally does not expose a server secret key.
Therefore the repository's actual HTTP PostgREST adapter has not yet been run
against the live project from this session.

`scripts/test-supabase-live.mjs` is ready for this step once
`VIDEO_STUDIO_SUPABASE_SECRET_KEY` is injected through a trusted runtime.

The security model will not be weakened by granting anon/authenticated access as
a workaround.

## Vercel status

The connected Vercel account has one team and no projects.

The repository already contains a verified `vercel.json` deployment pack.

Attempted write action:

```text
deploy_to_vercel
→ INVALID_ARGUMENT
→ Tool deploy_to_vercel not found
```

The Vercel connector exposes read APIs in this session but its declared deploy
action is unavailable at runtime. No Vercel project has been created.

## G12 gate state

Completed:

- [x] dedicated Supabase project provisioned
- [x] Supabase schema deployed
- [x] RLS/grants verified
- [x] security advisor clean
- [x] performance advisor reviewed
- [x] database-side service-role run persistence verified
- [x] database-side service-role audit persistence verified
- [x] no secret values committed or exposed

Pending:

- [ ] live HTTP PostgREST adapter test with server secret key
- [ ] dedicated Vercel project created/linked
- [ ] Vercel UI deployment
- [ ] live browser/API CORS verification
- [ ] concrete external render-worker provider selection
- [ ] end-to-end browser → API → Supabase → worker render evidence
