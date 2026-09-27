-- Dedicated Video Studio Supabase project only.
-- This is the SQL equivalent of adding video_studio_api to Data API
-- "Exposed schemas". It creates a manual authenticator override, so do not
-- use it on a shared Supabase project without first preserving all existing
-- exposed schemas.

alter role authenticator
  set pgrst.db_schemas = 'public, video_studio_api';

notify pgrst, 'reload config';
