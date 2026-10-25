-- Cycle 13: data for mockup v4 (portal knowledge, body system pages, score sheets, check ins, settings).
-- Runs after 20261022_goals_education_portions.sql. Idempotent: safe to run twice.
-- Rules this schema enforces:
--   * every bacterium fact carries the exact portal sentence it comes from (portal_quote not empty)
--   * Elevame groupings (score to body system, factor to foods) are labelled source = 'elevame'
--   * client facing per report content (verdicts, system lines) stays hidden until staff review it
--   * clients read only their own rows; clinicians read their own clients; admins write

-- ------------------------------------------------------------------ 1. catalogue: bacteria
create table if not exists taxon_profiles (
  taxon_id text primary key references taxa on delete cascade,
  role text not null check (role in ('helper','two_sided','watch','neutral','pathogen')),
  plain_en text not null,
  plain_es text,
  source text not null default 'portal' check (source in ('portal','report')),
  reviewed_at timestamptz
);
create table if not exists taxon_facts (
  id text primary key,                                -- <taxon_id>_<n>
  taxon_id text not null references taxa on delete cascade,
  kind text not null check (kind in ('does','linked','raises','lowers','note')),
  text_en text not null,
  text_es text,
  portal_quote text not null check (length(trim(portal_quote)) > 0),
  sort_order int not null default 0
);
create index if not exists taxon_facts_taxon on taxon_facts (taxon_id);

create table if not exists diet_factors (
  key text primary key,
  name_en text not null,
  name_es text
);
create table if not exists taxon_factors (            -- the portal text of this taxon names this factor
  taxon_id text references taxa on delete cascade,
  factor_key text references diet_factors on delete cascade,
  primary key (taxon_id, factor_key)
);
create table if not exists factor_foods (             -- example foods per factor: Elevame's choice, labelled as such
  factor_key text references diet_factors on delete cascade,
  food_id text references foods on delete cascade,
  source text not null default 'elevame' check (source = 'elevame'),
  sort_order int not null default 0,
  primary key (factor_key, food_id)
);

-- key bacteria: the portal prints some names at genus level (Akkermansia) that the app shows on the species card
alter table key_bacteria add column if not exists portal_name text;

-- pathways list producers without a direction
alter table condition_taxa drop constraint if exists condition_taxa_association_check;
alter table condition_taxa add constraint condition_taxa_association_check check (association in ('positive','negative','producer'));

-- gut score membership and important bacteria are readings too
alter table taxon_readings drop constraint if exists taxon_readings_context_type_check;
alter table taxon_readings add constraint taxon_readings_context_type_check
  check (context_type in ('screen','condition','pathway','gut_score','important'));
create unique index if not exists taxon_readings_ctx_uniq on taxon_readings (test_id, taxon_id, context_type, context_id);

-- ------------------------------------------------------------------ 2. catalogue: scores
alter table metrics add column if not exists client_group text
  check (client_group in ('body_system','habit_mirror','other'));
alter table metrics add column if not exists client_name_en text;   -- the name the app shows (Bowel mobility)
alter table metrics add column if not exists client_name_es text;
alter table metrics add column if not exists plain_en text;         -- one plain sentence, rewritten from the portal text
alter table metrics add column if not exists plain_es text;
alter table metric_markers add column if not exists label_es text;
create unique index if not exists metric_markers_uniq on metric_markers (test_id, metric_id, label_en);

-- ------------------------------------------------------------------ 3. per report: body system pages
create table if not exists body_system_status (
  test_id uuid references tests on delete cascade,
  theme_id text references themes,
  status text not null check (status in ('act','watch','good')),
  line_en text not null, line_es text,                 -- the one line under the system on Home
  reviewed_at timestamptz,
  primary key (test_id, theme_id)
);
create table if not exists body_system_signals (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests on delete cascade,
  theme_id text not null references themes,
  sort_order int not null default 0,
  title_en text not null, title_es text,
  metric_id text references metrics,                   -- set when the signal is one of the 13 scores
  status text not null check (status in ('act','watch','good')),
  verdict_en text not null, verdict_es text,
  detail_en text, detail_es text,                      -- small numbers line
  reviewed_at timestamptz,
  unique (test_id, theme_id, sort_order)
);
create table if not exists signal_taxa (
  signal_id uuid references body_system_signals on delete cascade,
  taxon_id text references taxa,
  relation text not null check (relation in ('more_with','less_with','makes','context')),
  condition_id text references conditions,             -- more_with / less_with: the portal association row
  product_en text, product_es text,                    -- makes: butyrate, TMA, GABA
  sort_order int not null default 0,
  primary key (signal_id, taxon_id),
  check (relation not in ('more_with','less_with') or condition_id is not null),
  check (relation <> 'makes' or product_en is not null)
);
create table if not exists body_system_levers (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests on delete cascade,
  theme_id text not null references themes,
  taxon_id text not null references taxa,
  fact_id text not null references taxon_facts,        -- the portal sentence behind the lever
  text_en text not null, text_es text,
  factor_key text references diet_factors,             -- foods come from factor_foods
  sort_order int not null default 0,
  reviewed_at timestamptz,
  unique (test_id, theme_id, sort_order)
);

create table if not exists body_system_lever_foods (   -- example foods shown under a lever: Elevame's choice from the client's list
  lever_id uuid references body_system_levers on delete cascade,
  food_id text references foods,
  sort_order int not null default 0,
  primary key (lever_id, food_id)
);

-- ------------------------------------------------------------------ 4. check ins and settings
alter table quick_checkins add column if not exists bloating int check (bloating between 1 and 5);
alter table quick_checkins add column if not exists sleep int check (sleep between 1 and 5);
alter table quick_checkins add column if not exists mood int check (mood between 1 and 5);

alter table symptom_checkins add column if not exists gas int check (gas between 1 and 5);
alter table symptom_checkins add column if not exists bowel_comfort int check (bowel_comfort between 1 and 5);
alter table symptom_checkins add column if not exists processed_snacks text;
-- the cycle 7 check allowed none / some / often; the v4 question has four answers (old values stay readable)
alter table symptom_checkins drop constraint if exists symptom_checkins_snacks_check;
alter table symptom_checkins add constraint symptom_checkins_snacks_check
  check (processed_snacks is null or processed_snacks in ('none','one_two','three_five','six_plus','some','often'));
-- v4 question to column: digestion, gas, heaviness ("How do you feel after meals?"), bowel_comfort, energy, sleep, mood,
-- processed_snacks, notes ("Anything else you've noticed?")

create table if not exists client_settings (
  client_id uuid primary key references clients on delete cascade,
  language text not null default 'en' check (language in ('en','es')),   -- en until Amina reviews the Spanish (decision 11.6)
  theme text not null default 'light' check (theme in ('light','dark','auto')),   -- light until decision 11.5
  text_size text not null default 'standard' check (text_size in ('standard','large')),
  meal_reminders boolean not null default true,
  daily_reminder boolean not null default true,
  phase_checkin_reminders boolean not null default true,
  weekly_summary boolean not null default true,
  shopping_reminder boolean not null default false,
  share_with_nutritionist boolean not null default true,
  show_portions boolean not null default false,        -- also needs the nutritionist's approval (cycle 8)
  show_calories boolean not null default false,        -- off unless the client switches it on
  daily_questions text[] not null default '{digestion,bloating,energy,sleep}'
    check (cardinality(daily_questions) between 1 and 4
       and daily_questions <@ array['digestion','bloating','energy','sleep','mood']),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ 5. RLS
do $$ declare t text; begin
  foreach t in array array['taxon_profiles','taxon_facts','diet_factors','taxon_factors','factor_foods'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t||'_read', t);
    execute format('create policy %I on %I for select using (auth.uid() is not null)', t||'_read', t);
    execute format('drop policy if exists %I on %I', t||'_admin', t);
    execute format('create policy %I on %I for all using (is_admin()) with check (is_admin())', t||'_admin', t);
  end loop;
end $$;

-- Yes or no checks only: they never reveal whose test it is (a function returning the client id would be callable by any user)
drop function if exists test_client(uuid) cascade;
create or replace function client_sees_test(p_test_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from tests t where t.id = p_test_id and t.published_at is not null and owns_client(t.client_id)) $$;
create or replace function staff_sees_test(p_test_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin() or exists (select 1 from tests t where t.id = p_test_id and clinician_owns_client(t.client_id)) $$;

-- per report content: the client sees it once reviewed and the test is published; staff see their clients
do $$ declare t text; begin
  foreach t in array array['body_system_status','body_system_signals','body_system_levers'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t||'_read', t);
    execute format('create policy %I on %I for select using ((reviewed_at is not null and client_sees_test(test_id)) or staff_sees_test(test_id))', t||'_read', t);
    execute format('drop policy if exists %I on %I', t||'_admin', t);
    execute format('create policy %I on %I for all using (is_admin()) with check (is_admin())', t||'_admin', t);
  end loop;
end $$;

alter table body_system_lever_foods enable row level security;
drop policy if exists blf_read on body_system_lever_foods;
create policy blf_read on body_system_lever_foods for select using (exists (select 1 from body_system_levers l where l.id = lever_id));
drop policy if exists blf_admin on body_system_lever_foods;
create policy blf_admin on body_system_lever_foods for all using (is_admin()) with check (is_admin());

alter table signal_taxa enable row level security;
drop policy if exists signal_taxa_read on signal_taxa;
create policy signal_taxa_read on signal_taxa for select using (
  exists (select 1 from body_system_signals s where s.id = signal_id));   -- inherits the signal's policy
drop policy if exists signal_taxa_admin on signal_taxa;
create policy signal_taxa_admin on signal_taxa for all using (is_admin()) with check (is_admin());

alter table client_settings enable row level security;
drop policy if exists client_settings_own on client_settings;
create policy client_settings_own on client_settings for all using (owns_client(client_id)) with check (owns_client(client_id));
drop policy if exists client_settings_staff on client_settings;
create policy client_settings_staff on client_settings for select using (clinician_owns_client(client_id) or is_admin());

-- ------------------------------------------------------------------ 6. views the screens read
-- Detected only: the app never shows a not detected bacterium (pathogens appear only on the safety screen, by count)
create or replace view v_score_taxa with (security_invoker = true) as
  select r.test_id, r.context_id as metric_id, r.taxon_id, t.name, r.status,
         p.role, p.plain_en, p.plain_es
  from taxon_readings r join taxa t on t.id = r.taxon_id left join taxon_profiles p on p.taxon_id = r.taxon_id
  where r.context_type = 'gut_score' and r.status <> 'not_detected';

-- Effective level: the portal label, except where Important bacteria shows the client far below or above most people
create or replace view v_taxon_level with (security_invoker = true) as
  with lab as (
    select test_id, taxon_id,
      (array_agg(status order by case context_type when 'gut_score' then 1 when 'condition' then 2 else 3 end))[1] as label
    from taxon_readings where status <> 'not_detected' group by test_id, taxon_id)
  select coalesce(l.test_id, k.test_id) as test_id, coalesce(l.taxon_id, k.taxon_id) as taxon_id,
    case when k.client_score is not null and k.client_score < k.community_score / 3.0 then 'low'
         when k.client_score is not null and k.client_score > k.community_score * 3 and k.client_score >= 10 then 'high'
         else l.label end as level,
    l.label as portal_label, k.client_score, k.community_score,
    (k.client_score is not null and l.label is not null and
      ((k.client_score < k.community_score / 3.0 and l.label <> 'low') or
       (k.client_score > k.community_score * 3 and k.client_score >= 10 and l.label <> 'high'))) as overridden
  from lab l full join key_bacteria k on k.test_id = l.test_id and k.taxon_id = l.taxon_id;

-- Daily check in streak: consecutive days up to today (or yesterday, so the streak survives until tonight)
create or replace view v_checkin_streak with (security_invoker = true) as
  with d as (select client_id, day, day - (row_number() over (partition by client_id order by day))::int as grp from quick_checkins),
       g as (select client_id, grp, min(day) as first_day, max(day) as last_day, count(*) as days from d group by client_id, grp)
  select client_id, case when last_day >= current_date - 1 then days else 0 end as streak_days
  from (select distinct on (client_id) * from g order by client_id, last_day desc) x;

-- Plan dates the views need, readable by the client, their clinician and admins only (profiles and plan_phases are owner only)
create or replace function can_read_client(p_client_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select owns_client(p_client_id) or clinician_owns_client(p_client_id) or is_admin()
      or coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'   -- server jobs
      or session_user = 'postgres' $$;                                                       -- migrations and tests
create or replace function client_plan_start(p_client_id uuid) returns date
language sql stable security definer set search_path = public as $$
  select pr.plan_start_date from clients c join profiles pr on pr.id = c.legacy_profile_id
  where c.id = p_client_id and can_read_client(p_client_id) $$;
create or replace function client_habit_windows(p_client_id uuid)
returns table (habit_key text, starts date, ends date)
language sql stable security definer set search_path = public as $$
  with ph as (select p.id, p.start_day, lead(p.start_day) over (order by p.phase_index) as next_start, pr.plan_start_date
              from clients c join profiles pr on pr.id = c.legacy_profile_id join plan_phases p on p.profile_id = pr.id
              where c.id = p_client_id and can_read_client(p_client_id))
  select h.key, ph.plan_start_date + ph.start_day - 1,                         -- start_day is 1 based
         ph.plan_start_date + coalesce(ph.next_start - 1, ph.start_day + 13) - 1   -- a phase runs to the day before the next one
  from ph join phase_habits h on h.phase_id = ph.id $$;

-- Habits and how you feel: a pattern shows only after 5 days done and 5 days skipped in the last 90 days.
-- Grouped by habit key, so a habit that runs through several phases (cook) builds one pattern. Days without a digestion answer don't count.
drop view if exists v_habit_insight;
create view v_habit_insight with (security_invoker = true) as
  with days as (
    select distinct q.client_id, q.day, q.digestion, w.habit_key,
           exists (select 1 from habit_logs l join phase_habits h2 on h2.id = l.habit_id
                   where l.client_id = q.client_id and h2.key = w.habit_key and l.day = q.day) as done
    from quick_checkins q
    cross join lateral client_habit_windows(q.client_id) w
    where q.day >= current_date - 90 and q.digestion is not null and q.day between w.starts and w.ends)
  select client_id, habit_key,
    count(*) filter (where done) as days_done,
    count(*) filter (where not done) as days_skipped,
    (count(*) filter (where done) >= 5 and count(*) filter (where not done) >= 5) as ready,
    case when count(*) filter (where done) >= 5 and count(*) filter (where not done) >= 5
      then round(avg(digestion) filter (where done) - avg(digestion) filter (where not done), 1) end as digestion_difference
  from days group by client_id, habit_key;

-- How you feel: weekly averages per measure for the line charts (week 1 starts on the plan start date)
drop view if exists v_weekly_feel;
create view v_weekly_feel with (security_invoker = true) as
  select q.client_id, ((q.day - client_plan_start(q.client_id)) / 7) + 1 as plan_week,
         round(avg(q.digestion), 1) as digestion, round(avg(q.bloating), 1) as bloating,
         round(avg(q.energy), 1) as energy, round(avg(q.sleep), 1) as sleep, round(avg(q.mood), 1) as mood,
         count(*) as days_logged
  from quick_checkins q
  where q.day >= client_plan_start(q.client_id)
  group by q.client_id, plan_week;

-- ------------------------------------------------------------------ 7. Round 2 review fixes
-- Clients read their own detected readings (the app schema made taxon_readings staff only)
drop policy if exists taxon_readings_select_client on taxon_readings;
create policy taxon_readings_select_client on taxon_readings for select
  using (status <> 'not_detected' and context_type in ('gut_score','condition','pathway','important') and client_sees_test(test_id));

-- Short display name (Akkermansia for Akkermansia muciniphila)
alter table taxon_profiles add column if not exists display_name text;

-- "Share my progress with my nutritionist": when off, staff cannot read the client's check ins, habits or meals
create or replace function shares_progress(p_client_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select share_with_nutritionist from client_settings where client_id = p_client_id), true) $$;
do $$ declare t text; begin
  foreach t in array array['quick_checkins','symptom_checkins','habit_logs','meal_logs'] loop
    execute format('drop policy if exists %I on %I', t||'_share_gate', t);
    execute format('create policy %I on %I as restrictive for select using (owns_client(client_id) or shares_progress(client_id))', t||'_share_gate', t);
  end loop;
end $$;

-- Per report sentences that are not bacteria facts (habits card footer, plan links, variety summary, progress lines).
-- Written per client by Elevame, hidden until reviewed, like the signals.
create table if not exists report_texts (
  test_id uuid references tests on delete cascade,
  key text not null check (key in ('habits_footer','plan_link_processed','plan_link_sugar','variety_summary',
                                   'progress_dig','progress_lin','progress_wt','progress_div')),
  text_en text not null, text_es text,
  reviewed_at timestamptz,
  primary key (test_id, key)
);
alter table report_texts enable row level security;
drop policy if exists report_texts_read on report_texts;
create policy report_texts_read on report_texts for select using ((reviewed_at is not null and client_sees_test(test_id)) or staff_sees_test(test_id));
drop policy if exists report_texts_admin on report_texts;
create policy report_texts_admin on report_texts for all using (is_admin()) with check (is_admin());
