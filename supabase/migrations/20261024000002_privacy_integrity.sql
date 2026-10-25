-- Cycle 14: privacy, integrity and GDPR fixes from the round 1 reviews. Runs after 20261024_rls_performance_hardening.sql. Idempotent.
begin;

-- ------------------------------------------------------------------ 0. who counts as a server job
-- Every API request runs as anon, authenticated or service_role (PostgREST sets the role). Server jobs are service_role
-- or a direct database connection (pg_cron, migrations), which never carries the anon or authenticated role.
-- current_setting('role') is the session's role even inside security definer. Replaces the old session_user and legacy claim bypass.
create or replace function is_server_job() returns boolean
language sql stable set search_path = public as $$
  select coalesce(nullif(current_setting('role', true), ''), 'none') not in ('anon', 'authenticated') $$;
create or replace function can_read_client(p_client_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select owns_client(p_client_id) or clinician_owns_client(p_client_id) or is_admin() or is_server_job() $$;

alter table client_settings add column if not exists timezone text not null default 'Europe/Madrid';
-- the client's own calendar day, so check ins, streaks and plan weeks follow Barcelona time, not UTC
create or replace function client_today(p_client_id uuid) returns date
language sql stable security definer set search_path = public as $$
  select (now() at time zone coalesce((select timezone from client_settings where client_id = p_client_id), 'Europe/Madrid'))::date $$;

-- ------------------------------------------------------------------ 1. clinicians see only their own clients
drop policy if exists clients_select_scoped on clients;
create policy clients_select_scoped on clients for select to authenticated
  using (auth_user_id = (select auth.uid()) or id in (select my_clinician_client_ids()) or (select is_admin()));
drop policy if exists kits_select_scoped on kits;
create policy kits_select_scoped on kits for select to authenticated
  using (client_id in (select my_client_ids()) or client_id in (select my_clinician_client_ids()) or (select is_admin()));
drop policy if exists cg_update_own on client_goals;
create policy cg_update_own on client_goals for update to authenticated
  using (client_id in (select my_client_ids()) or client_id in (select my_clinician_client_ids()) or (select is_admin()));
drop policy if exists cg_delete_staff on client_goals;
create policy cg_delete_staff on client_goals for delete to authenticated
  using (client_id in (select my_clinician_client_ids()) or (select is_admin()));

create or replace function suggest_weight_guide_guard(p_client_id uuid) returns void
language plpgsql stable security definer set search_path = public as $$
begin if not (is_admin() or clinician_owns_client(p_client_id)) then raise exception 'not your client'; end if; end $$;
do $$ begin   -- put the guard at the top of suggest_weight_guide without rewriting its body
  if position('suggest_weight_guide_guard' in pg_get_functiondef('suggest_weight_guide'::regproc)) = 0 then
    execute replace(pg_get_functiondef('suggest_weight_guide'::regproc),
      'if not is_staff() then raise exception ''staff only''; end if;',
      'if not is_staff() then raise exception ''staff only''; end if; perform suggest_weight_guide_guard(p_client_id);');
  end if;
end $$;

-- ------------------------------------------------------------------ 2. the share switch covers everything about progress, everywhere
do $$ declare t text; begin
  foreach t in array array['quick_checkins','symptom_checkins','habit_logs','meal_logs','meal_swaps','meal_keepers','habit_swaps','body_metrics'] loop
    execute format('drop policy if exists %I on %I', t||'_share_gate', t);
    execute format('create policy %I on %I as restrictive for select to authenticated using (client_id in (select my_client_ids()) or not (client_id in (select unshared_client_ids())))', t||'_share_gate', t);
  end loop;
end $$;
-- adoption_weekly is security definer, so it checks the switch itself; planned meals count only days so far
create or replace function adoption_weekly(p_client_id uuid)
returns table (week int, week_start date, week_end date, meals_followed int, meals_planned int, swaps_made int,
               habit_days int, daily_taps int, picks_added int, milestone text)
language sql stable security definer set search_path = public as $$
  with c as (
    select cl.id as client_id, p.plan_start_date as start
    from clients cl join profiles p on p.id = cl.legacy_profile_id
    where cl.id = p_client_id
      and (owns_client(p_client_id) or ((clinician_owns_client(p_client_id) or is_admin()) and shares_progress(p_client_id)))
  ), w as (
    select c.client_id, g as week, c.start + (g - 1) * 7 as ws, c.start + g * 7 - 1 as we
    from c, generate_series(1, 6) g
  )
  select w.week, w.ws, w.we,
    (select count(*) from meal_logs l where l.client_id = w.client_id and l.day between w.ws and w.we)::int,
    (4 * greatest(0, least(7, client_today(w.client_id) - w.ws + 1)))::int,
    (select count(*) from meal_swaps s where s.client_id = w.client_id and s.created_at::date between w.ws and w.we)::int,
    (select count(distinct h.day) from habit_logs h where h.client_id = w.client_id and h.day between w.ws and w.we)::int,
    (select count(*) from quick_checkins q where q.client_id = w.client_id and q.day between w.ws and w.we)::int,
    (select count(*) from my_picks m where m.client_id = w.client_id and m.created_at::date between w.ws and w.we)::int,
    (select string_agg(sc.milestone, ', ') from symptom_checkins sc
       where sc.client_id = w.client_id and sc.kind = 'milestone' and sc.created_at::date between w.ws and w.we)
  from w order by w.week $$;

-- ------------------------------------------------------------------ 3. settings: always one row, never deletable, time zone for the local day
alter table client_settings add column if not exists timezone text not null default 'Europe/Madrid';
alter table client_settings drop column if exists show_portions;          -- weight_goals.show_portions is the one source
insert into client_settings (client_id) select id from clients on conflict do nothing;
create or replace function create_client_settings() returns trigger
language plpgsql security definer set search_path = public as $$
begin insert into client_settings (client_id) values (new.id) on conflict do nothing; return new; end $$;
drop trigger if exists clients_create_settings on clients;
create trigger clients_create_settings after insert on clients for each row execute function create_client_settings();
create or replace function touch_updated_at() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists client_settings_touch on client_settings;
create trigger client_settings_touch before update on client_settings for each row execute function touch_updated_at();
drop policy if exists client_settings_own on client_settings;
drop policy if exists cs_select on client_settings; drop policy if exists cs_update on client_settings;
create policy cs_select on client_settings for select to authenticated using (client_id in (select my_client_ids()));
create policy cs_update on client_settings for update to authenticated
  using (client_id in (select my_client_ids())) with check (client_id in (select my_client_ids()));
-- (no insert or delete for clients: the row is made by the trigger)

create or replace view v_checkin_streak with (security_invoker = true) as
  with d as (select client_id, day, day - (row_number() over (partition by client_id order by day))::int as grp from quick_checkins),
       g as (select client_id, grp, max(day) as last_day, count(*) as days from d group by client_id, grp)
  select client_id, case when last_day >= client_today(client_id) - 1 then days else 0 end as streak_days
  from (select distinct on (client_id) * from g order by client_id, last_day desc) x;

-- check ins only for recent days (WHOOP style: up to 14 days back), never in the future
create or replace function guard_checkin_day() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.day > client_today(new.client_id) + 1 or new.day < client_today(new.client_id) - 14 then
    raise exception 'check ins can be for today or the last 14 days';
  end if; return new; end $$;
drop trigger if exists quick_checkins_day_guard on quick_checkins;
create trigger quick_checkins_day_guard before insert or update on quick_checkins for each row
  when (not is_server_job()) execute function guard_checkin_day();

-- ------------------------------------------------------------------ 4. editing approved text sends it back for review
alter table body_system_status add column if not exists reviewed_by uuid references auth.users on delete set null;
alter table body_system_signals add column if not exists reviewed_by uuid references auth.users on delete set null;
alter table body_system_levers add column if not exists reviewed_by uuid references auth.users on delete set null;
alter table report_texts add column if not exists reviewed_by uuid references auth.users on delete set null;
do $$ declare t text; begin
  foreach t in array array['body_system_status','body_system_signals','body_system_levers','report_texts'] loop
    execute format('alter table %I add column if not exists reviewed_es_at timestamptz', t);
  end loop;
end $$;
create or replace function reset_review() returns trigger language plpgsql set search_path = public as $$
declare ignore text[] := array['reviewed_at','reviewed_by','reviewed_es_at'];
begin
  if (to_jsonb(new) - ignore) is distinct from (to_jsonb(old) - ignore) and new.reviewed_at is not distinct from old.reviewed_at then
    new.reviewed_at := null; new.reviewed_by := null;
  end if;
  if exists (select 1 from jsonb_each_text(to_jsonb(new)) n join jsonb_each_text(to_jsonb(old)) o using (key)
             where key like '%\_es' and n.value is distinct from o.value) and new.reviewed_es_at is not distinct from old.reviewed_es_at then
    new.reviewed_es_at := null;
  end if;
  return new; end $$;
do $$ declare t text; begin
  foreach t in array array['body_system_status','body_system_signals','body_system_levers','report_texts'] loop
    execute format('drop trigger if exists %I on %I', t||'_reset_review', t);
    execute format('create trigger %I before update on %I for each row execute function reset_review()', t||'_reset_review', t);
  end loop;
end $$;

-- ------------------------------------------------------------------ 5. which test is current; effective level that filters fast
create or replace view v_current_test with (security_invoker = true) as
  select distinct on (client_id) id as test_id, client_id, test_number, report_date, published_at
  from tests where published_at is not null order by client_id, test_number desc;

create or replace view v_taxon_level with (security_invoker = true) as
  with u as (
    select r.test_id, r.taxon_id,
           (array_agg(r.status order by case r.context_type when 'gut_score' then 1 when 'condition' then 2 else 3 end))[1] as label,
           null::numeric as client_score, null::numeric as community_score
    from taxon_readings r where r.status <> 'not_detected' group by r.test_id, r.taxon_id
    union all
    select k.test_id, k.taxon_id, null, k.client_score, k.community_score from key_bacteria k),
  g as (select test_id, taxon_id, max(label) as label, max(client_score) as client_score, max(community_score) as community_score
        from u group by test_id, taxon_id)
  select test_id, taxon_id,
    case when client_score is not null and client_score < community_score / 3.0 then 'low'
         when client_score is not null and client_score > community_score * 3 and client_score >= 10 then 'high'
         else label end as level,
    label as portal_label, client_score, community_score,
    (client_score is not null and label is not null and
      ((client_score < community_score / 3.0 and label <> 'low') or
       (client_score > community_score * 3 and client_score >= 10 and label <> 'high'))) as overridden
  from g;

-- ------------------------------------------------------------------ 6. data quality constraints
drop index if exists taxon_readings_ctx_uniq;
create unique index if not exists taxon_readings_ctx_uniq on taxon_readings (test_id, taxon_id, context_type, context_id) nulls not distinct;
alter table taxon_readings alter column test_id set not null, alter column context_type set not null, alter column status set not null;
alter table clients add column if not exists preferred_name text;            -- the name the app greets with, set by staff

-- ------------------------------------------------------------------ 7. GDPR: consent records, export, deletion
create table if not exists consents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  kind text not null check (kind in ('health_data_processing','share_with_nutritionist','product_updates')),
  version text not null,                       -- version of the consent text shown
  given_at timestamptz not null default now(),
  withdrawn_at timestamptz
);
create index if not exists consents_client_idx on consents (client_id, kind);
alter table consents enable row level security;
drop policy if exists consents_select on consents; drop policy if exists consents_insert on consents; drop policy if exists consents_withdraw on consents;
create policy consents_select on consents for select to authenticated
  using (client_id in (select my_client_ids()) or client_id in (select my_clinician_client_ids()) or (select is_admin()));
create policy consents_insert on consents for insert to authenticated with check (client_id in (select my_client_ids()) and withdrawn_at is null);
create policy consents_withdraw on consents for update to authenticated
  using (client_id in (select my_client_ids())) with check (client_id in (select my_client_ids()) and withdrawn_at is not null);
create or replace function has_health_consent(p_client_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from consents where client_id = p_client_id and kind = 'health_data_processing' and withdrawn_at is null) $$;

-- deleting a client removes everything about them (auth user deletion itself runs in an Edge Function with the service key)
alter table clients drop constraint if exists clients_auth_user_id_fkey;
alter table clients add constraint clients_auth_user_id_fkey foreign key (auth_user_id) references auth.users (id) on delete cascade;
delete from clinician_clients cc where not exists (select 1 from clients c where c.id = cc.client_id);
alter table clinician_clients drop constraint if exists clinician_clients_client_id_fkey;
alter table clinician_clients add constraint clinician_clients_client_id_fkey foreign key (client_id) references clients (id) on delete cascade;
create index if not exists clinician_clients_client_idx on clinician_clients (client_id);
alter table tests drop constraint if exists tests_reviewed_by_fkey;
alter table tests add constraint tests_reviewed_by_fkey foreign key (reviewed_by) references auth.users (id) on delete set null;
create or replace function delete_client_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin if old.legacy_profile_id is not null then delete from profiles where id = old.legacy_profile_id; end if; return old; end $$;
drop trigger if exists clients_delete_profile on clients;
create trigger clients_delete_profile after delete on clients for each row execute function delete_client_profile();

-- everything the client can see about themselves, as one JSON document (GDPR Art. 15 and 20)
create or replace function export_my_data() returns jsonb
language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'exported_at', now(),
    'client', (select to_jsonb(c) - 'auth_user_id' from clients c where c.id in (select my_client_ids())),
    'settings', (select to_jsonb(s) from client_settings s where s.client_id in (select my_client_ids())),
    'consents', (select coalesce(jsonb_agg(x), '[]') from consents x where x.client_id in (select my_client_ids())),
    'daily_check_ins', (select coalesce(jsonb_agg(q order by q.day), '[]') from quick_checkins q where q.client_id in (select my_client_ids())),
    'phase_check_ins', (select coalesce(jsonb_agg(s), '[]') from symptom_checkins s where s.client_id in (select my_client_ids())),
    'meals_logged', (select coalesce(jsonb_agg(m), '[]') from meal_logs m where m.client_id in (select my_client_ids())),
    'habits_logged', (select coalesce(jsonb_agg(h), '[]') from habit_logs h where h.client_id in (select my_client_ids())),
    'goals', (select coalesce(jsonb_agg(g), '[]') from client_goals g where g.client_id in (select my_client_ids())),
    'body_metrics', (select coalesce(jsonb_agg(b), '[]') from body_metrics b where b.client_id in (select my_client_ids())),
    'results', (select coalesce(jsonb_agg(r), '[]') from metric_results r where r.test_id in (select my_published_test_ids())),
    'food_scores', (select coalesce(jsonb_agg(f), '[]') from food_scores f where f.test_id in (select my_published_test_ids()))) $$;

-- ------------------------------------------------------------------ 8. anon runs nothing new either
do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.prosecdef loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated, service_role', f.sig);
  end loop;
end $$;
revoke execute on function export_my_data() from public, anon;
grant execute on function export_my_data() to authenticated;
-- ------------------------------------------------------------------ 9. every foreign key gets an index (Supabase linter rule 0001, unindexed_foreign_keys)
do $$ declare r record; begin
  for r in select c.conrelid::regclass as tbl, c.conrelid, array_agg(a.attname order by k.ord) as cols
           from pg_constraint c cross join lateral unnest(c.conkey) with ordinality k(attnum, ord)
           join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
           where c.contype = 'f' and c.connamespace = 'public'::regnamespace
             and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and (i.indkey::int2[])[0] = c.conkey[1])
           group by c.oid, c.conrelid loop
    execute format('create index if not exists %I on %s (%s)', left(r.tbl::text || '_' || array_to_string(r.cols, '_') || '_fkidx', 63),
                   r.tbl, (select string_agg(quote_ident(x), ', ') from unnest(r.cols) x));
  end loop;
end $$;
commit;
