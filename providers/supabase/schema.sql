-- Video Studio operational store for Supabase.
-- This schema is server-side only. Add "video_studio_api" to the project's
-- Data API exposed schemas before using the PostgREST adapter.
--
-- Security model:
--   * RLS is enabled on every exposed table.
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
