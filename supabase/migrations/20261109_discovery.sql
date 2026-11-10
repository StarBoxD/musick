-- Additive discovery tables with strict allowlist and user ownership enforcement.
-- Does not drop or recreate profiles, favorites, or playlists.

create table if not exists public.seen_tracks (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null,
  song jsonb not null,
  source text not null default 'discover',
  seen_at timestamptz not null default now(),
  primary key (user_id, track_id)
);
alter table public.seen_tracks enable row level security;
drop policy if exists "Users manage own seen tracks" on public.seen_tracks;
drop policy if exists "Allowed users manage own seen tracks" on public.seen_tracks;

create policy "Allowed users manage own seen tracks" on public.seen_tracks
for all to authenticated
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

create table if not exists public.daily_vybes (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  track_id text not null,
  song jsonb not null,
  primary key (user_id, day)
);
alter table public.daily_vybes enable row level security;
drop policy if exists "Users manage own daily vybe" on public.daily_vybes;
drop policy if exists "Allowed users manage own daily vybe" on public.daily_vybes;

create policy "Allowed users manage own daily vybe" on public.daily_vybes
for all to authenticated
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
