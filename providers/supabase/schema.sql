-- Video Studio operational store for Supabase.
-- This schema is server-side only.
--
-- Security model:
--   * RLS is enabled on every exposed table.
--   * Explicit deny policies exist for anon/authenticated.
--   * PUBLIC, anon and authenticated receive no schema/table/sequence access.
--   * service_role is granted only the operations required by the server.
--   * No client/browser key should ever be used with this schema.

create schema if not exists video_studio_api;

revoke all on schema video_studio_api from public;
revoke all on schema video_studio_api from anon;
revoke all on schema video_studio_api from authenticated;

create table if not exists video_studio_api.runs (
  id text primary key,
  status text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists runs_updated_at_idx
  on video_studio_api.runs (updated_at desc);

create table if not exists video_studio_api.audit_events (
  id bigint generated always as identity primary key,
  action text not null,
  outcome text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_created_at_idx
  on video_studio_api.audit_events (created_at desc);

alter table video_studio_api.runs enable row level security;
alter table video_studio_api.audit_events enable row level security;

drop policy if exists deny_client_access_runs
  on video_studio_api.runs;
create policy deny_client_access_runs
on video_studio_api.runs
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists deny_client_access_audit_events
  on video_studio_api.audit_events;
create policy deny_client_access_audit_events
on video_studio_api.audit_events
for all
to anon, authenticated
using (false)
with check (false);

revoke all on all tables in schema video_studio_api from public;
revoke all on all tables in schema video_studio_api from anon;
revoke all on all tables in schema video_studio_api from authenticated;
revoke all on all sequences in schema video_studio_api from public;
revoke all on all sequences in schema video_studio_api from anon;
revoke all on all sequences in schema video_studio_api from authenticated;

grant usage on schema video_studio_api to service_role;
grant select, insert, update, delete
  on video_studio_api.runs
  to service_role;
grant select, insert
  on video_studio_api.audit_events
  to service_role;
grant usage, select
  on all sequences in schema video_studio_api
  to service_role;

alter default privileges for role postgres in schema video_studio_api
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema video_studio_api
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema video_studio_api
  grant select, insert, update, delete on tables to service_role;
alter default privileges for role postgres in schema video_studio_api
  grant usage, select on sequences to service_role;
