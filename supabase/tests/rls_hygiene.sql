-- Structural RLS/security checks that need no client data, so they can
-- run in this repo's own CI on every PR (unlike the full acceptance
-- suite, which needs a seeded client report and lives in the private
-- elevame-redesign repo). Run after supabase/migrations/ + seed.sql.
-- Source: outputs/cycle-14/supabase/acceptance_tests_cycle14.sql in
-- elevame-redesign (the first 6 "RLS hygiene" checks only).
create or replace function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %', label; end if; raise notice 'ok  %', label; end $$;

select pg_temp.check((select count(*) from pg_policies where schemaname = 'public' and roles <> '{authenticated}') = 0, 'rls: every policy is for signed in users only');
select pg_temp.check((select count(*) from pg_policies where schemaname = 'public'
  and coalesce(qual, '') || coalesce(with_check, '') ~ '\m(owns_client|clinician_owns_client|owns_test|client_sees_test|staff_sees_test|owns_profile|owns_phase|owns_meal|shares_progress)\(') = 0,
  'rls: no per row helper call left in any policy');
select pg_temp.check((select count(*) from pg_policies where schemaname = 'public'
  and coalesce(qual, '') || coalesce(with_check, '') ~ '(?<!SELECT )(auth\.uid|is_admin|is_staff)\(\)') = 0, 'rls: role checks run once per query');
select pg_temp.check((select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef and has_function_privilege('anon', p.oid, 'execute')) = 0, 'rls: anon can run no privileged function');
select pg_temp.check((
  select count(*) from pg_constraint c
  where c.contype = 'f' and c.connamespace = 'public'::regnamespace
    and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and (i.indkey::int2[])[0] = c.conkey[1])) = 0,
  'rls: every foreign key has an index');
select pg_temp.check((select count(*) from pg_class where relkind = 'v' and relnamespace = 'public'::regnamespace
  and not coalesce(reloptions::text[] @> '{security_invoker=true}', false) and relname like 'v\_%') = 0, 'rls: every app view runs with the reader''s rights');
select pg_temp.check((select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prolang <> 12
  and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
  and (p.prosecdef or p.oid in (select tgfoid from pg_trigger))) = 0, 'rls: privileged and trigger functions pin their search path (lint 0011)');
