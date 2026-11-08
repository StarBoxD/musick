-- VYBE profile table and row-level security
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

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
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();


-- VYBE music library: favorites and user playlists
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
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);
alter table public.playlists enable row level security;
drop policy if exists "Users manage own playlists" on public.playlists;
create policy "Users manage own playlists" on public.playlists
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

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
using (exists (
  select 1 from public.playlists p
  where p.id = playlist_id and p.user_id = auth.uid()
))
with check (exists (
  select 1 from public.playlists p
  where p.id = playlist_id and p.user_id = auth.uid()
));
