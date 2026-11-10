-- Migration: 20261110_discovery_allowlist_hardening.sql
-- Removes weak RLS policies created without allowlist verification and hardens claim_unseen_tracks.

-- 1. Hardened policies for seen_tracks
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

-- 2. Hardened policies for daily_vybes
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

-- 3. Hardened claim_unseen_tracks function ensuring allowlist check
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
