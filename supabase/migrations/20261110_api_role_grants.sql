-- PROPOSED - NOT YET APPLIED TO PRODUCTION. Needs owner approval before running.
-- Why: this Supabase project does not auto-grant new public tables to API roles
-- (live probe: anon gets 42501 "permission denied" on all 7 tables). RLS policies
-- alone are not enough: a role needs GRANT first, then RLS filters rows.
-- anon intentionally receives nothing.

grant usage on schema public to authenticated;

-- Allowlist: read-only; the RLS policy limits each user to their own active row.
grant select on table public.allowed_users to authenticated;

-- Profile: own row (RLS).
grant select, insert, update on table public.profiles to authenticated;

-- Library + discovery tables used by components/music/use-library.ts and app/api/music/*.
grant select, insert, update, delete on table
  public.favorites,
  public.playlists,
  public.playlist_tracks,
  public.seen_tracks,
  public.daily_vybes
to authenticated;
