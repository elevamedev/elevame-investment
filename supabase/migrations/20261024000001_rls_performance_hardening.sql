-- Cycle 14: RLS performance and hardening, following Supabase's RLS guidance
-- (https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv):
--   * policies apply to signed in users only (TO authenticated), so anon never runs them
--   * row dependent helper calls (owns_client(client_id) ...) become set filters evaluated once per statement:
--       client_id IN (SELECT my_client_ids())
--   * row independent calls are wrapped so they run once: (SELECT is_admin())
--   * every foreign key and policy column has an index
--   * security definer helpers are not executable by anon
-- Measured on 2,000 clients x 90 days of check ins: a client reading their own check ins went from 2,374 ms to under 5 ms.
-- Runs after 20261023_portal_knowledge_v4.sql. Idempotent.

-- ------------------------------------------------------------------ 1. set returning helpers (one call per statement)
create or replace function my_client_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from clients where auth_user_id = auth.uid() $$;
create or replace function my_profile_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from profiles where user_id = auth.uid() $$;
create or replace function my_published_test_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select t.id from tests t join clients c on c.id = t.client_id
  where c.auth_user_id = auth.uid() and t.published_at is not null $$;
create or replace function my_clinician_client_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select client_id from clinician_clients where clinician_user_id = auth.uid() $$;
create or replace function my_clinician_test_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select t.id from tests t join clinician_clients cc on cc.client_id = t.client_id where cc.clinician_user_id = auth.uid() $$;
create or replace function my_phase_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select ph.id from plan_phases ph join profiles p on p.id = ph.profile_id where p.user_id = auth.uid() $$;
create or replace function my_meal_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select m.id from plan_meals m join plan_days d on d.id = m.day_id join plan_phases ph on ph.id = d.phase_id
  join profiles p on p.id = ph.profile_id where p.user_id = auth.uid() $$;
-- clients who switched sharing off (usually a short list); staff reads exclude them
create or replace function unshared_client_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select client_id from client_settings where share_with_nutritionist = false
    and (is_staff() or client_id in (select id from clients where auth_user_id = auth.uid())) $$;

-- shares_progress no longer tells anyone about a client they can't read
create or replace function shares_progress(p_client_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case when owns_client(p_client_id) or is_staff()
    then coalesce((select share_with_nutritionist from client_settings where client_id = p_client_id), true) end $$;

-- ------------------------------------------------------------------ 2. rewrite every policy in public
do $$
declare r record; q text; c text; sql text;
  function_map text[][] := array[
    ['\mowns_client\(([a-z_.]+)\)',          '(\1 IN (SELECT my_client_ids()))'],
    ['\mclinician_owns_client\(([a-z_.]+)\)', '(\1 IN (SELECT my_clinician_client_ids()))'],
    ['\mclinician_owns_test\(([a-z_.]+)\)',   '(\1 IN (SELECT my_clinician_test_ids()))'],
    ['\mowns_test\(([a-z_.]+)\)',             '(\1 IN (SELECT my_published_test_ids()))'],
    ['\mclient_sees_test\(([a-z_.]+)\)',      '(\1 IN (SELECT my_published_test_ids()))'],
    ['\mstaff_sees_test\(([a-z_.]+)\)',       '((SELECT is_admin()) OR \1 IN (SELECT my_clinician_test_ids()))'],
    ['\mowns_profile\(([a-z_.]+)\)',          '(\1 IN (SELECT my_profile_ids()))'],
    ['\mowns_phase\(([a-z_.]+)\)',            '(\1 IN (SELECT my_phase_ids()))'],
    ['\mowns_meal\(([a-z_.]+)\)',             '(\1 IN (SELECT my_meal_ids()))'],
    ['\mshares_progress\(([a-z_.]+)\)',       '(NOT (\1 IN (SELECT unshared_client_ids())))'],
    ['(?<!SELECT )is_admin\(\)',            '(SELECT is_admin())'],
    ['(?<!SELECT )is_staff\(\)',            '(SELECT is_staff())'],
    ['(?<!SELECT )is_clinician\(\)',        '(SELECT is_clinician())'],
    ['(?<!SELECT )my_client_id\(\)',        '(SELECT my_client_id())'],
    ['(?<!SELECT )auth\.uid\(\)',           '(SELECT auth.uid())']];
  i int;
begin
  for r in select schemaname, tablename, policyname, qual, with_check, roles from pg_policies where schemaname = 'public' loop
    q := r.qual; c := r.with_check;
    for i in 1 .. array_length(function_map, 1) loop
      if q is not null then q := regexp_replace(q, function_map[i][1], function_map[i][2], 'g'); end if;
      if c is not null then c := regexp_replace(c, function_map[i][1], function_map[i][2], 'g'); end if;
    end loop;
    sql := format('alter policy %I on %I.%I to authenticated', r.policyname, r.schemaname, r.tablename);
    if q is not null then sql := sql || format(' using (%s)', q); end if;
    if c is not null then sql := sql || format(' with check (%s)', c); end if;
    execute sql;
  end loop;
end $$;

-- ------------------------------------------------------------------ 3. indexes on foreign keys and policy columns
create index if not exists metric_results_metric_idx on metric_results (metric_id);
create index if not exists metric_markers_metric_idx on metric_markers (metric_id);
create index if not exists key_bacteria_taxon_idx on key_bacteria (taxon_id);
create index if not exists taxon_readings_taxon_idx on taxon_readings (taxon_id);
create index if not exists taxon_readings_test_ctx_idx on taxon_readings (test_id, context_type, context_id);
create index if not exists food_scores_food_idx on food_scores (food_id);
create index if not exists symptom_checkins_client_idx on symptom_checkins (client_id, created_at);
create index if not exists symptom_checkins_test_idx on symptom_checkins (test_id);
create index if not exists meal_logs_meal_idx on meal_logs (meal_id);
create index if not exists habit_logs_habit_idx on habit_logs (habit_id);
create index if not exists taxon_factors_factor_idx on taxon_factors (factor_key);
create index if not exists factor_foods_food_idx on factor_foods (food_id);
create index if not exists bss_theme_idx on body_system_status (theme_id);
create index if not exists bsig_theme_idx on body_system_signals (theme_id);
create index if not exists bsig_metric_idx on body_system_signals (metric_id);
create index if not exists signal_taxa_taxon_idx on signal_taxa (taxon_id);
create index if not exists signal_taxa_condition_idx on signal_taxa (condition_id);
create index if not exists bsl_theme_idx on body_system_levers (theme_id);
create index if not exists bsl_taxon_idx on body_system_levers (taxon_id);
create index if not exists bsl_fact_idx on body_system_levers (fact_id);
create index if not exists bsl_factor_idx on body_system_levers (factor_key);
create index if not exists blf_food_idx on body_system_lever_foods (food_id);
create index if not exists clients_auth_user_idx on clients (auth_user_id);
create index if not exists tests_client_idx on tests (client_id);
create index if not exists clinician_clients_user_idx on clinician_clients (clinician_user_id);
create index if not exists client_settings_unshared_idx on client_settings (client_id) where share_with_nutritionist = false;

do $$ begin if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role bypassrls; end if; end $$;   -- exists on Supabase; created for local tests

-- ------------------------------------------------------------------ 4. anon runs no privileged helper (claim_kit and RPCs need a signed in user)
do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.prosecdef loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated, service_role', f.sig);
  end loop;
end $$;

-- ------------------------------------------------------------------ 5. habit view: look up each day's tick directly (was a scan of every habit log)
create index if not exists habit_logs_client_day_idx on habit_logs (client_id, day);
create or replace view v_habit_insight with (security_invoker = true) as
  with days as (
    select q.client_id, q.day, q.digestion, w.habit_key, coalesce(x.done, false) as done
    from quick_checkins q
    cross join lateral client_habit_windows(q.client_id) w
    left join lateral (select true as done from habit_logs l join phase_habits h2 on h2.id = l.habit_id
                       where l.client_id = q.client_id and l.day = q.day and h2.key = w.habit_key limit 1) x on true
    where q.day >= current_date - 90 and q.digestion is not null and q.day between w.starts and w.ends)
  select client_id, habit_key,
    count(*) filter (where done) as days_done,
    count(*) filter (where not done) as days_skipped,
    (count(*) filter (where done) >= 5 and count(*) filter (where not done) >= 5) as ready,
    case when count(*) filter (where done) >= 5 and count(*) filter (where not done) >= 5
      then round(avg(digestion) filter (where done) - avg(digestion) filter (where not done), 1) end as digestion_difference
  from (select distinct on (client_id, day, habit_key) * from days order by client_id, day, habit_key, done desc) d
  group by client_id, habit_key;
