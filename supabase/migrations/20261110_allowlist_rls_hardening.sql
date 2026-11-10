-- Migration: 20261110_allowlist_rls_hardening.sql
-- COMPREHENSIVE RLS SECURITY HARDENING & WEAK PERMISSIVE POLICY CLEANUP
--
-- Why: PostgreSQL combines multiple PERMISSIVE policies on the same table with OR logic.
-- If an old policy (e.g., "Users manage own favorites" using (auth.uid() = user_id)) remains alongside
-- a hardened policy, PostgreSQL will permit access even if the user is NOT on the allowlist!
--
-- This migration explicitly drops ALL legacy/weak permissive policies across all 7 public tables
-- and establishes single, strict policies enforcing BOTH user ownership AND active allowlist status.

-- Ensure search_path is safe
set search_path = public;

-- ============================================================================
-- 1. allowed_users
-- ============================================================================
alter table public.allowed_users enable row level security;
drop policy if exists "Users can read their own allowlist status" on public.allowed_users;
drop policy if exists "Allowed users can read allowlist status" on public.allowed_users;

create policy "Allowed users can read allowlist status"
on public.allowed_users for select to authenticated
using (
  email = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  and is_active = true
);

-- ============================================================================
-- 2. profiles
-- ============================================================================
alter table public.profiles enable row level security;
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Allowed users manage own profile" on public.profiles;

create policy "Allowed users manage own profile"
on public.profiles for all to authenticated
using (
  auth.uid() = id
  and exists (
    select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active = true
  )
)
with check (
  auth.uid() = id
  and exists (
    select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active = true
  )
);

-- ============================================================================
-- 3. favorites
-- ============================================================================
alter table public.favorites enable row level security;
-- Drop legacy weak policies that omitted allowlist verification
drop policy if exists "Users manage own favorites" on public.favorites;
drop policy if exists "Allowed users manage own favorites" on public.favorites;

create policy "Allowed users manage own favorites"
on public.favorites for all to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active = true
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active = true
  )
);

-- ============================================================================
-- 4. playlists
-- ============================================================================
alter table public.playlists enable row level security;
-- Drop legacy weak policies that omitted allowlist verification
drop policy if exists "Users manage own playlists" on public.playlists;
drop policy if exists "Allowed users manage own playlists" on public.playlists;

create policy "Allowed users manage own playlists"
on public.playlists for all to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active = true
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active = true
  )
);

-- ============================================================================
-- 5. playlist_tracks
-- ============================================================================
alter table public.playlist_tracks enable row level security;
-- Drop legacy weak policies that omitted allowlist verification
drop policy if exists "Users manage tracks in own playlists" on public.playlist_tracks;
drop policy if exists "Allowed users manage tracks in own playlists" on public.playlist_tracks;

create policy "Allowed users manage tracks in own playlists"
on public.playlist_tracks for all to authenticated
using (
  exists (
    select 1 from public.playlists p
    where p.id = playlist_id and p.user_id = auth.uid()
  )
  and exists (
    select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active = true
  )
)
with check (
  exists (
    select 1 from public.playlists p
    where p.id = playlist_id and p.user_id = auth.uid()
  )
  and exists (
    select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active = true
  )
);

-- ============================================================================
-- 6. seen_tracks
-- ============================================================================
alter table public.seen_tracks enable row level security;
drop policy if exists "Users manage own seen tracks" on public.seen_tracks;
drop policy if exists "Allowed users manage own seen tracks" on public.seen_tracks;

create policy "Allowed users manage own seen tracks"
on public.seen_tracks for all to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active = true
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active = true
  )
);

-- ============================================================================
-- 7. daily_vybes
-- ============================================================================
alter table public.daily_vybes enable row level security;
drop policy if exists "Users manage own daily vybe" on public.daily_vybes;
drop policy if exists "Allowed users manage own daily vybe" on public.daily_vybes;

create policy "Allowed users manage own daily vybe"
on public.daily_vybes for all to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active = true
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active = true
  )
);

-- ============================================================================
-- 8. claim_unseen_tracks function hardening
-- ============================================================================
create or replace function public.claim_unseen_tracks(p_tracks jsonb, p_take integer, p_source text)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  u_email text := lower(coalesce((select auth.jwt() ->> 'email'), ''));
  result jsonb;
begin
  if uid is null then
    raise exception 'Authentication required.';
  end if;

  if not exists (
    select 1 from public.allowed_users au
    where au.email = u_email and au.is_active = true
  ) then
    raise exception 'User is not in active allowed_users list.';
  end if;

  if p_take < 1 or p_take > 24 then
    raise exception 'Invalid take parameter.';
  end if;

  perform pg_advisory_xact_lock(hashtext(uid::text));

  with incoming as (
    select value as song, value->>'trackId' as track_id
    from jsonb_array_elements(coalesce(p_tracks, '[]'::jsonb))
    where coalesce(value->>'trackId', '') <> ''
  ),
  fresh as (
    select song, track_id from incoming i
    where not exists (
      select 1 from public.seen_tracks s
      where s.user_id = uid and s.track_id = i.track_id
    )
    limit p_take
  ),
  ins as (
    insert into public.seen_tracks (user_id, track_id, song, source)
    select uid, track_id, song, left(coalesce(p_source, 'discover'), 40)
    from fresh
    on conflict (user_id, track_id) do nothing
    returning song
  )
  select coalesce(jsonb_agg(song), '[]'::jsonb) into result from ins;

  return result;
end;
$$;

revoke all on function public.claim_unseen_tracks(jsonb, integer, text) from public;
grant execute on function public.claim_unseen_tracks(jsonb, integer, text) to authenticated;
