-- VYBE music features migration
-- Additive only: this does not modify or remove the existing profiles table.

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id bigint not null,
  song jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);
alter table public.favorites enable row level security;
drop policy if exists "Users manage own favorites" on public.favorites;
create policy "Users manage own favorites" on public.favorites
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);
alter table public.playlists enable row level security;
drop policy if exists "Users manage own playlists" on public.playlists;
create policy "Users manage own playlists" on public.playlists
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.playlist_tracks (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  track_id bigint not null,
  song jsonb not null,
  created_at timestamptz not null default now(),
  unique (playlist_id, track_id)
);
alter table public.playlist_tracks enable row level security;
drop policy if exists "Users manage tracks in own playlists" on public.playlist_tracks;
create policy "Users manage tracks in own playlists" on public.playlist_tracks
for all to authenticated
using (
  exists (
    select 1 from public.playlists p
    where p.id = playlist_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.playlists p
    where p.id = playlist_id and p.user_id = auth.uid()
  )
);
