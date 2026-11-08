-- Additive discovery tables. Does not drop or recreate profiles, favorites, or playlists.

create table if not exists public.seen_tracks (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id bigint not null,
  song jsonb not null,
  source text not null default 'discover',
  seen_at timestamptz not null default now(),
  primary key (user_id, track_id)
);
alter table public.seen_tracks enable row level security;
drop policy if exists "Users manage own seen tracks" on public.seen_tracks;
create policy "Users manage own seen tracks" on public.seen_tracks
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.daily_vybes (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  track_id bigint not null,
  song jsonb not null,
  primary key (user_id, day)
);
alter table public.daily_vybes enable row level security;
drop policy if exists "Users manage own daily vybe" on public.daily_vybes;
create policy "Users manage own daily vybe" on public.daily_vybes
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
