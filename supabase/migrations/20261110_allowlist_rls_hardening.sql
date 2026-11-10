-- Migration: 20261110_allowlist_rls_hardening.sql
-- COMPREHENSIVE RLS SECURITY HARDENING & WEAK PERMISSIVE POLICY CLEANUP
--
-- ARCHITECTURE & SECURITY GUARANTEES:
-- 1. PostgreSQL combines multiple PERMISSIVE policies on the same table with OR logic.
--    If an old policy (e.g. "Users manage own favorites" using (auth.uid() = user_id)) remains alongside
--    a hardened allowlist policy, PostgreSQL evaluates (old_policy OR new_policy) -> TRUE!
--    This migration explicitly drops ALL legacy/weak permissive policies across all 7 public tables.
--
-- 2. Granular Table Policies:
--    Each table is protected with distinct, operation-specific policies (SELECT, INSERT, UPDATE, DELETE).
--    Exact column mapping is verified:
--    - profiles: column is "id" (references auth.users.id). There is NO "user_id" column.
--    - allowed_users: primary key is "email" (check email = lower(email)). There is NO "user_id" column.
--    - playlist_tracks: column is "playlist_id" (references playlists.id). There is NO "user_id" column.
--      Ownership is verified via join: exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid()).
--    - favorites, playlists, seen_tracks, daily_vybes: column is "user_id".
--
-- 3. Active Allowlist Enforcement:
--    Every operation on every user-facing table requires the user's JWT email to exist in public.allowed_users
--    with is_active = true.
--
-- 4. SECURITY DEFINER Search Path & Privilege Hardening:
--    - All SECURITY DEFINER trigger functions are set with search_path = '' and fully-qualified schema identifiers.
--    - Direct EXECUTE privileges are revoked from PUBLIC and anon.
--    - claim_unseen_tracks is defined as SECURITY INVOKER with safe search_path and EXECUTE granted only to authenticated.

-- Safe search path for migration execution
set search_path = public, auth, pg_catalog;

-- ============================================================================
-- 1. allowed_users
-- ============================================================================
alter table public.allowed_users enable row level security;

-- Drop all legacy policies
drop policy if exists "Users can read their own allowlist status" on public.allowed_users;
drop policy if exists "Allowed users can read allowlist status" on public.allowed_users;
drop policy if exists "Allowed users select own status" on public.allowed_users;

-- Authenticated users can ONLY select their own status when active.
-- No INSERT, UPDATE, or DELETE policies exist for authenticated users (service role only).
create policy "Allowed users select own status"
on public.allowed_users for select to authenticated
using (
  email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
  and is_active = true
);

-- ============================================================================
-- 2. profiles (PK is id, NOT user_id)
-- ============================================================================
alter table public.profiles enable row level security;

-- Drop all legacy policies
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Allowed users manage own profile" on public.profiles;
drop policy if exists "Allowed users select own profile" on public.profiles;
drop policy if exists "Allowed users insert own profile" on public.profiles;
drop policy if exists "Allowed users update own profile" on public.profiles;
drop policy if exists "Allowed users delete own profile" on public.profiles;

create policy "Allowed users select own profile"
on public.profiles for select to authenticated
using (
  auth.uid() = id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

create policy "Allowed users insert own profile"
on public.profiles for insert to authenticated
with check (
  auth.uid() = id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

create policy "Allowed users update own profile"
on public.profiles for update to authenticated
using (
  auth.uid() = id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
)
with check (
  auth.uid() = id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

-- Profile deletion is cascade-only via auth.users; no direct DELETE policy granted.
drop policy if exists "Allowed users delete own profile" on public.profiles;

-- ============================================================================
-- 3. favorites (user_id uuid, track_id text)
-- ============================================================================
alter table public.favorites enable row level security;

-- Drop all legacy policies
drop policy if exists "Users manage own favorites" on public.favorites;
drop policy if exists "Allowed users manage own favorites" on public.favorites;
drop policy if exists "Allowed users select own favorites" on public.favorites;
drop policy if exists "Allowed users insert own favorites" on public.favorites;
drop policy if exists "Allowed users update own favorites" on public.favorites;
drop policy if exists "Allowed users delete own favorites" on public.favorites;

create policy "Allowed users select own favorites"
on public.favorites for select to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

create policy "Allowed users insert own favorites"
on public.favorites for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

create policy "Allowed users update own favorites"
on public.favorites for update to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

create policy "Allowed users delete own favorites"
on public.favorites for delete to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

-- ============================================================================
-- 4. playlists (id uuid, user_id uuid, name text)
-- ============================================================================
alter table public.playlists enable row level security;

-- Drop all legacy policies
drop policy if exists "Users manage own playlists" on public.playlists;
drop policy if exists "Allowed users manage own playlists" on public.playlists;
drop policy if exists "Allowed users select own playlists" on public.playlists;
drop policy if exists "Allowed users insert own playlists" on public.playlists;
drop policy if exists "Allowed users update own playlists" on public.playlists;
drop policy if exists "Allowed users delete own playlists" on public.playlists;

create policy "Allowed users select own playlists"
on public.playlists for select to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

create policy "Allowed users insert own playlists"
on public.playlists for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

create policy "Allowed users update own playlists"
on public.playlists for update to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

create policy "Allowed users delete own playlists"
on public.playlists for delete to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

-- ============================================================================
-- 5. playlist_tracks (id uuid, playlist_id uuid references playlists.id)
--    NOTE: NO user_id column. Access verified via playlists relation.
-- ============================================================================
alter table public.playlist_tracks enable row level security;

-- Drop all legacy policies
drop policy if exists "Users manage tracks in own playlists" on public.playlist_tracks;
drop policy if exists "Allowed users manage tracks in own playlists" on public.playlist_tracks;
drop policy if exists "Allowed users select tracks in own playlists" on public.playlist_tracks;
drop policy if exists "Allowed users insert tracks in own playlists" on public.playlist_tracks;
drop policy if exists "Allowed users update tracks in own playlists" on public.playlist_tracks;
drop policy if exists "Allowed users delete tracks in own playlists" on public.playlist_tracks;

create policy "Allowed users select tracks in own playlists"
on public.playlist_tracks for select to authenticated
using (
  exists (
    select 1 from public.playlists p
    where p.id = playlist_id and p.user_id = auth.uid()
  )
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

create policy "Allowed users insert tracks in own playlists"
on public.playlist_tracks for insert to authenticated
with check (
  exists (
    select 1 from public.playlists p
    where p.id = playlist_id and p.user_id = auth.uid()
  )
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

create policy "Allowed users update tracks in own playlists"
on public.playlist_tracks for update to authenticated
using (
  exists (
    select 1 from public.playlists p
    where p.id = playlist_id and p.user_id = auth.uid()
  )
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
)
with check (
  exists (
    select 1 from public.playlists p
    where p.id = playlist_id and p.user_id = auth.uid()
  )
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

create policy "Allowed users delete tracks in own playlists"
on public.playlist_tracks for delete to authenticated
using (
  exists (
    select 1 from public.playlists p
    where p.id = playlist_id and p.user_id = auth.uid()
  )
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

-- ============================================================================
-- 6. seen_tracks (user_id uuid, track_id text)
-- ============================================================================
alter table public.seen_tracks enable row level security;

-- Drop all legacy policies
drop policy if exists "Users manage own seen tracks" on public.seen_tracks;
drop policy if exists "Allowed users manage own seen tracks" on public.seen_tracks;
drop policy if exists "Allowed users select own seen tracks" on public.seen_tracks;
drop policy if exists "Allowed users insert own seen tracks" on public.seen_tracks;
drop policy if exists "Allowed users update own seen tracks" on public.seen_tracks;
drop policy if exists "Allowed users delete own seen tracks" on public.seen_tracks;

create policy "Allowed users select own seen tracks"
on public.seen_tracks for select to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

create policy "Allowed users insert own seen tracks"
on public.seen_tracks for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

create policy "Allowed users update own seen tracks"
on public.seen_tracks for update to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

-- Seen tracks deletion is not permitted for authenticated users (audit / anti-repetition integrity).
drop policy if exists "Allowed users delete own seen tracks" on public.seen_tracks;

-- ============================================================================
-- 7. daily_vybes (user_id uuid, day date, track_id text)
-- ============================================================================
alter table public.daily_vybes enable row level security;

-- Drop all legacy policies
drop policy if exists "Users manage own daily vybe" on public.daily_vybes;
drop policy if exists "Allowed users manage own daily vybe" on public.daily_vybes;
drop policy if exists "Allowed users select own daily vybe" on public.daily_vybes;
drop policy if exists "Allowed users insert own daily vybe" on public.daily_vybes;
drop policy if exists "Allowed users update own daily vybe" on public.daily_vybes;
drop policy if exists "Allowed users delete own daily vybe" on public.daily_vybes;

create policy "Allowed users select own daily vybe"
on public.daily_vybes for select to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

create policy "Allowed users insert own daily vybe"
on public.daily_vybes for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

create policy "Allowed users update own daily vybe"
on public.daily_vybes for update to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.allowed_users au
    where au.email = pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''))
    and au.is_active = true
  )
);

-- Daily vybe deletion is not permitted for authenticated users.
drop policy if exists "Allowed users delete own daily vybe" on public.daily_vybes;

-- ============================================================================
-- 8. SECURITY DEFINER Functions Hardening & Privilege Revocation
-- ============================================================================

-- 8.1. handle_new_user: Security Definer with empty search path
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    pg_catalog.coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon;

-- 8.2. enforce_vybe_five_active_users: Security Definer with empty search path
create or replace function public.enforce_vybe_five_active_users()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_count integer;
begin
  if new.is_active then
    perform pg_catalog.pg_advisory_xact_lock(4815162342);
    if tg_op = 'UPDATE' then
      select pg_catalog.count(*) into active_count from public.allowed_users
      where is_active and email <> old.email;
    else
      select pg_catalog.count(*) into active_count from public.allowed_users where is_active;
    end if;
    if active_count >= 5 then
      raise exception 'VYBE private beta is limited to five active accounts.';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.enforce_vybe_five_active_users() from public, anon;

-- 8.3. reject_unlisted_signup: Security Definer with empty search path
create or replace function public.reject_unlisted_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.allowed_users
    where email = pg_catalog.lower(pg_catalog.coalesce(new.email, '')) and is_active
  ) then
    raise exception 'VYBE kaydı kapalı. Bu e-posta izin listesinde değil.';
  end if;
  return new;
end;
$$;
revoke execute on function public.reject_unlisted_signup() from public, anon;

-- ============================================================================
-- 9. claim_unseen_tracks (SECURITY INVOKER with strict allowlist check)
-- ============================================================================
create or replace function public.claim_unseen_tracks(p_tracks jsonb, p_take integer, p_source text)
returns jsonb
language plpgsql
security invoker
set search_path = public, auth, pg_catalog
as $$
declare
  uid uuid := auth.uid();
  u_email text := pg_catalog.lower(pg_catalog.coalesce((select auth.jwt() ->> 'email'), ''));
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

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(uid::text));

  with incoming as (
    select value as song, value->>'trackId' as track_id
    from pg_catalog.jsonb_array_elements(pg_catalog.coalesce(p_tracks, '[]'::jsonb))
    where pg_catalog.coalesce(value->>'trackId', '') <> ''
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
    select uid, track_id, song, pg_catalog.left(pg_catalog.coalesce(p_source, 'discover'), 40)
    from fresh
    on conflict (user_id, track_id) do nothing
    returning song
  )
  select pg_catalog.coalesce(pg_catalog.jsonb_agg(song), '[]'::jsonb) into result from ins;

  return result;
end;
$$;

-- Revoke all execute from public and anon, grant only to authenticated
revoke all on function public.claim_unseen_tracks(jsonb, integer, text) from public, anon;
grant execute on function public.claim_unseen_tracks(jsonb, integer, text) to authenticated;
