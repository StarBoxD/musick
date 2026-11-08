-- Private beta + Audius IDs + Never Again.
-- Additive: does not drop profiles, favorites, playlists, or playlist tracks.

create table if not exists public.allowed_users (
  email text primary key check (email = lower(email)),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.allowed_users enable row level security;

drop policy if exists "Users can read their own allowlist status" on public.allowed_users;
create policy "Users can read their own allowlist status"
on public.allowed_users for select to authenticated
using (email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and is_active = true);

create or replace function public.enforce_vybe_five_active_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_count integer;
begin
  if new.is_active then
    perform pg_advisory_xact_lock(4815162342);
    if tg_op = 'UPDATE' then
      select count(*) into active_count from public.allowed_users
      where is_active and email <> old.email;
    else
      select count(*) into active_count from public.allowed_users where is_active;
    end if;
    if active_count >= 5 then
      raise exception 'VYBE private beta is limited to five active accounts.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists limit_vybe_active_users on public.allowed_users;
create trigger limit_vybe_active_users
before insert or update of is_active on public.allowed_users
for each row execute function public.enforce_vybe_five_active_users();

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null,
  song jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);
create table if not exists public.playlist_tracks (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  track_id text not null,
  song jsonb not null,
  created_at timestamptz not null default now(),
  unique (playlist_id, track_id)
);

alter table if exists public.favorites alter column track_id type text using track_id::text;
alter table if exists public.playlist_tracks alter column track_id type text using track_id::text;

create table if not exists public.seen_tracks (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null,
  song jsonb not null,
  source text not null default 'discover',
  seen_at timestamptz not null default now(),
  primary key (user_id, track_id)
);
alter table if exists public.seen_tracks alter column track_id type text using track_id::text;
alter table public.seen_tracks add column if not exists source text not null default 'discover';

create table if not exists public.daily_vybes (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  track_id text not null,
  song jsonb not null,
  primary key (user_id, day)
);
alter table if exists public.daily_vybes alter column track_id type text using track_id::text;

create or replace function public.claim_unseen_tracks(p_tracks jsonb, p_take integer, p_source text)
returns jsonb
language plpgsql
as $$
declare
  uid uuid := auth.uid();
  result jsonb;
begin
  if uid is null then
    raise exception 'auth required';
  end if;
  if p_take < 1 or p_take > 24 then
    raise exception 'invalid take';
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

alter table public.favorites enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.seen_tracks enable row level security;
alter table public.daily_vybes enable row level security;

drop policy if exists "Users manage own seen tracks" on public.seen_tracks;
drop policy if exists "Allowed users manage own seen tracks" on public.seen_tracks;
create policy "Allowed users manage own seen tracks"
on public.seen_tracks for all to authenticated
using (
  auth.uid() = user_id
  and exists (select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active)
)
with check (
  auth.uid() = user_id
  and exists (select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active)
);

drop policy if exists "Users manage own daily vybe" on public.daily_vybes;
create policy "Users manage own daily vybe"
on public.daily_vybes for all to authenticated
using (
  auth.uid() = user_id
  and exists (select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active)
)
with check (
  auth.uid() = user_id
  and exists (select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active)
);

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select to authenticated
using (
  auth.uid() = id
  and exists (select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active)
);
drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
on public.profiles for insert to authenticated
with check (
  auth.uid() = id
  and exists (select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active)
);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (
  auth.uid() = id
  and exists (select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active)
)
with check (
  auth.uid() = id
  and exists (select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active)
);

drop policy if exists "Users manage own favorites" on public.favorites;
create policy "Users manage own favorites"
on public.favorites for all to authenticated
using (
  auth.uid() = user_id
  and exists (select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active)
)
with check (
  auth.uid() = user_id
  and exists (select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active)
);

drop policy if exists "Users manage own playlists" on public.playlists;
create policy "Users manage own playlists"
on public.playlists for all to authenticated
using (
  auth.uid() = user_id
  and exists (select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active)
)
with check (
  auth.uid() = user_id
  and exists (select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active)
);

drop policy if exists "Users manage tracks in own playlists" on public.playlist_tracks;
create policy "Users manage tracks in own playlists"
on public.playlist_tracks for all to authenticated
using (
  exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid())
  and exists (select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active)
)
with check (
  exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid())
  and exists (select 1 from public.allowed_users au
    where au.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) and au.is_active)
);

create or replace function public.reject_unlisted_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.allowed_users
    where email = lower(coalesce(new.email, '')) and is_active
  ) then
    raise exception 'VYBE kaydı kapalı. Bu e-posta izin listesinde değil.';
  end if;
  return new;
end;
$$;

drop trigger if exists vybe_reject_unlisted_signup on auth.users;
create trigger vybe_reject_unlisted_signup
before insert on auth.users
for each row execute function public.reject_unlisted_signup();

-- Add emails only when the five addresses are ready. Do not put passwords here.
-- insert into public.allowed_users (email) values
--   ('owner@example.com'),
--   ('friend1@example.com'),
--   ('friend2@example.com'),
--   ('friend3@example.com'),
--   ('friend4@example.com');
