-- VYBE read-only diagnostics. Safe to run in Supabase Dashboard > SQL Editor.
-- Nothing here writes data. Section 9 changes the role ONLY inside a transaction that is rolled back.
-- Before running, confirm the dashboard URL contains: /project/fynfijzprzbqrsnodxlb

-- 1) Which database am I connected to?
select current_database() as db, current_user as sql_editor_role, now();

-- 2) Grants for every public table, per API role (GRANT layer, separate from RLS)
select c.relname as table_name, r.role,
       has_table_privilege(r.role, c.oid, 'SELECT') as can_select,
       has_table_privilege(r.role, c.oid, 'INSERT') as can_insert,
       has_table_privilege(r.role, c.oid, 'UPDATE') as can_update,
       has_table_privilege(r.role, c.oid, 'DELETE') as can_delete
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join (values ('anon'), ('authenticated')) as r(role)
where n.nspname = 'public' and c.relkind = 'r'
order by 1, 2;

-- 3) Schema usage
select r as role, has_schema_privilege(r, 'public', 'USAGE') as public_usage
from unnest(array['anon', 'authenticated']) as r;

-- 4) RLS on/off (the RLS layer)
select relname as table_name, relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' order by 1;

-- 5) Policies
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies where schemaname = 'public' order by 1, 2;

-- 6) Default privileges (explains why new tables get no grants for anon/authenticated)
select pg_get_userbyid(defaclrole) as owner, defaclnamespace::regnamespace as schema,
       defaclobjtype as obj_type, defaclacl as acl
from pg_default_acl order by 1, 2, 3;

-- 7) Column types the code depends on (Audius IDs are TEXT such as 'AK3w5q0', not bigint)
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('allowed_users','profiles','favorites','playlists','playlist_tracks','seen_tracks','daily_vybes')
order by table_name, ordinal_position;

-- 8) Allowlist contents vs real auth users (emails are your own beta users)
select count(*) as total_rows, count(*) filter (where is_active) as active_rows from public.allowed_users;
select u.email as auth_email, u.created_at, u.last_sign_in_at,
       a.email is not null as in_allowlist, a.is_active
from auth.users u
left join public.allowed_users a on a.email = lower(u.email)
order by u.created_at desc limit 20;

-- 9) Simulate the REAL runtime role used by /auth/callback (authenticated + JWT email claim).
--    Replace both placeholders with your own Google account values, then run this block alone.
begin;
  select set_config('request.jwt.claims',
    json_build_object('sub', 'REPLACE_WITH_AUTH_USER_UUID', 'role', 'authenticated',
                      'email', 'replace_with_your_email@gmail.com')::text, true);
  set local role authenticated;
  select 'allowed_users' as t, count(*) from public.allowed_users;   -- expect 1 (your row)
  select 'profiles' as t, count(*) from public.profiles;
  select 'favorites' as t, count(*) from public.favorites;
  select 'playlists' as t, count(*) from public.playlists;
  select 'playlist_tracks' as t, count(*) from public.playlist_tracks;
  select 'seen_tracks' as t, count(*) from public.seen_tracks;
  select 'daily_vybes' as t, count(*) from public.daily_vybes;
rollback;
-- "permission denied for table X" here = missing GRANT. A count of 0 when you expected rows = RLS/policy/email mismatch.

-- 10) Triggers on auth.users (signup gate)
select tgname, tgenabled, pg_get_triggerdef(oid) from pg_trigger
where tgrelid = 'auth.users'::regclass and not tgisinternal;
