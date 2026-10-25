-- ============================================================
-- Elevame redesign migration (cycle 6 of 7)
--
-- Run AFTER supabase/schema.sql, schema_v2_data_model.sql and
-- schema_v2_admin.sql. Additive and idempotent: safe to re-run, drops
-- no table and no client row. The only column it drops is the
-- generated food_scores.band, which is recomputed from score.
--
-- Tested on Postgres 16 against the schema files of branch
-- feature/data-model-v2 (2026-10-18) with a small auth stub
-- (auth.users, auth.uid(), roles authenticated and anon).
--
-- Identity rule: every NEW per person table keys on clients.id
-- (column client_id) and uses owns_client(). The v1 plan tables stay
-- keyed on profiles.id until a later migration; clients.legacy_profile_id
-- links the two.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Helpers
-- ------------------------------------------------------------
create or replace function my_client_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from clients where auth_user_id = auth.uid() order by created_at limit 1;
$$;

create or replace function owns_client(p_client_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from clients where id = p_client_id and auth_user_id = auth.uid());
$$;

create or replace function clinician_owns_client(p_client_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from clinician_clients where client_id = p_client_id and clinician_user_id = auth.uid());
$$;

-- true when the signed in user owns the plan meal (plan_meals -> plan_days -> plan_phases -> profiles)
create or replace function owns_meal(p_meal_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from plan_meals m
    join plan_days d on d.id = m.day_id
    join plan_phases ph on ph.id = d.phase_id
    join profiles p on p.id = ph.profile_id
    where m.id = p_meal_id and p.user_id = auth.uid());
$$;

-- ------------------------------------------------------------
-- 2. Food bands: Enrich / Include / Reduce
-- ------------------------------------------------------------
do $$ begin
  if exists (select 1 from information_schema.columns where table_name = 'food_scores' and column_name = 'band')
     and not exists (select 1 from food_scores where band = 'enrich' limit 1)
     and exists (select 1 from pg_attribute a join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
                 where a.attrelid = 'food_scores'::regclass and a.attname = 'band'
                   and pg_get_expr(d.adbin, d.adrelid) like '%prioritise%') then
    alter table food_scores drop column band;
  end if;
end $$;
alter table food_scores add column if not exists band text generated always as (
  case when score >= 8 then 'enrich' when score >= 4 then 'include' else 'reduce' end) stored;

-- ------------------------------------------------------------
-- 3. Profiles: path and preferences (plan_start_date already exists)
-- ------------------------------------------------------------
alter table profiles
  add column if not exists adoption_path text not null default 'plan',
  add column if not exists daily_checkin boolean not null default true,
  add column if not exists onboarded_at timestamptz,
  add column if not exists own_symptom_en text,
  add column if not exists own_symptom_es text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_adoption_path_check') then
    alter table profiles add constraint profiles_adoption_path_check check (adoption_path in ('plan','habits'));
  end if;
end $$;
-- Security fix: profiles_update_own lets a client update EVERY column of
-- their row today (kit_code, expected_email, microbiome_age ...).
-- Keep the row policy, but limit the columns a client may write.
revoke update on profiles from authenticated;
grant update (language, plan_start_date, adoption_path, daily_checkin, onboarded_at, own_symptom_en, own_symptom_es)
  on profiles to authenticated;

-- ------------------------------------------------------------
-- 4. Catalogue: client wording, producers, links
-- ------------------------------------------------------------
alter table conditions
  add column if not exists pattern_name_en text,
  add column if not exists pattern_name_es text;

-- Biosynthesis pathway tables (butyrate, propionate, polyamine, serotonin,
-- GABA) are stored with association NULL by seedReportV2.mjs. Name them.
alter table condition_taxa drop constraint if exists condition_taxa_association_check;
alter table condition_taxa add constraint condition_taxa_association_check
  check (association in ('positive','negative','producer'));
update condition_taxa set association = 'producer'
  where association is null
    and condition_id in ('butyric_acid_biosynthesis','propionate_biosynthesis','polyamine_biosynthesis',
                         'serotonin_biosynthesis','gaba_biosynthesis');

alter table taxa
  add column if not exists plain_en text, add column if not exists plain_es text,   -- report wording only
  add column if not exists gap_en text,   add column if not exists gap_es text;

alter table metrics
  add column if not exists client_action_en text,
  add column if not exists client_action_es text,
  add column if not exists client_action_page text;

-- Client wording for the printed reference markers. Catalogue, not per test:
-- metric_markers rows are per test and keep the printed label_en.
create table if not exists marker_labels (
  metric_id text references metrics,
  printed_label text not null,
  client_label_en text not null, client_label_es text not null,
  primary key (metric_id, printed_label)
);
alter table marker_labels enable row level security;
drop policy if exists marker_labels_read on marker_labels;
create policy marker_labels_read on marker_labels for select using (true);
drop policy if exists marker_labels_admin on marker_labels;
create policy marker_labels_admin on marker_labels for all using (is_admin()) with check (is_admin());

create table if not exists score_pattern_links (
  metric_id text references metrics,
  condition_id text references conditions,
  source text not null check (source in ('report','elevame_link')),
  note text not null,                       -- why, with page
  primary key (metric_id, condition_id)
);
create table if not exists score_screen_links (
  metric_id text references metrics,
  panel_id text references screen_panels,
  source text not null check (source in ('report','elevame_link')),
  note text not null,
  primary key (metric_id, panel_id)
);
alter table score_pattern_links enable row level security;
alter table score_screen_links enable row level security;
drop policy if exists spl_read on score_pattern_links;
create policy spl_read on score_pattern_links for select using (auth.uid() is not null);
drop policy if exists ssl_read on score_screen_links;
create policy ssl_read on score_screen_links for select using (auth.uid() is not null);
drop policy if exists spl_admin on score_pattern_links;
create policy spl_admin on score_pattern_links for all using (is_admin()) with check (is_admin());
drop policy if exists ssl_admin on score_screen_links;
create policy ssl_admin on score_screen_links for all using (is_admin()) with check (is_admin());

-- Foods: plant flag, photo metadata (foods.image_url already exists), aisle override
alter table foods
  add column if not exists is_plant boolean not null default false,
  add column if not exists image_alt_en text,
  add column if not exists image_alt_es text,
  add column if not exists image_credit text,
  add column if not exists shop_group_override text;
-- food_categories.shopping_list_group already exists (values produce, grains,
-- dairy, nuts, herbs, null). The catalogue seed rewrites it to the 8 aisles:
-- fruit_veg, bread_grains, legumes, meat_fish, dairy_eggs, nuts_seeds_oils, herbs_seasoning, other.

-- Curated swaps (catalogue). A nutritionist approves culinary matches.
create table if not exists swap_pairs (
  from_food_id text references foods,
  to_food_id text references foods,
  approved boolean not null default false,
  approved_by uuid references auth.users (id),
  primary key (from_food_id, to_food_id)
);
alter table swap_pairs enable row level security;
drop policy if exists swap_pairs_read on swap_pairs;
create policy swap_pairs_read on swap_pairs for select using (approved or is_staff());
drop policy if exists swap_pairs_admin on swap_pairs;
create policy swap_pairs_admin on swap_pairs for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- 5. Food rules: extend client_intolerances (agreed spec) instead of a new table
-- ------------------------------------------------------------
alter table client_intolerances
  add column if not exists reason text not null default 'intolerance',
  add column if not exists note text,
  add column if not exists set_by text not null default 'nutritionist';
alter table client_intolerances drop constraint if exists client_intolerances_reason_check;
alter table client_intolerances add constraint client_intolerances_reason_check
  check (reason in ('intolerance','allergy','practice','preference'));
alter table client_intolerances drop constraint if exists client_intolerances_set_by_check;
alter table client_intolerances add constraint client_intolerances_set_by_check
  check (set_by in ('client','nutritionist'));
alter table client_intolerances drop constraint if exists client_intolerances_source_check;
alter table client_intolerances add constraint client_intolerances_source_check
  check (source in ('consultation','symptom_tracker','onboarding','profile'));
alter table client_intolerances drop constraint if exists client_intolerances_target_check;
alter table client_intolerances add constraint client_intolerances_target_check
  check (food_id is not null or family is not null);
create unique index if not exists client_intolerances_food_uq on client_intolerances (client_id, food_id) where food_id is not null;
create unique index if not exists client_intolerances_family_uq on client_intolerances (client_id, family) where family is not null;
-- A client adds and removes their own rules; rules set by the nutritionist are read only for the client.
drop policy if exists ci_insert_own on client_intolerances;
create policy ci_insert_own on client_intolerances for insert
  with check ((owns_client(client_id) and set_by = 'client') or is_staff());
drop policy if exists ci_delete_own on client_intolerances;
create policy ci_delete_own on client_intolerances for delete
  using ((owns_client(client_id) and set_by = 'client') or is_staff());
drop policy if exists ci_update_staff on client_intolerances;
create policy ci_update_staff on client_intolerances for update using (is_staff()) with check (is_staff());

-- Clinical review flags already live in food_review_flags (test_id, food_id,
-- reason, action hide | annotate | keep). The heart flag is reason
-- 'saturated_fat_heart', action 'annotate'. No new table.

-- ------------------------------------------------------------
-- 6. Goals: extend insights (admin approval flow already exists)
-- ------------------------------------------------------------
alter table insights
  add column if not exists key text,                       -- digestion_comfort | diversity | gut_lining | weight_sugar
  add column if not exists kind text,
  add column if not exists tracking text,
  add column if not exists tracking_metric text,           -- digestion | plant_foods_week | processed_snacks | sugar
  add column if not exists sort_order int not null default 0,
  add column if not exists gap_en text, add column if not exists gap_es text,
  add column if not exists client_visible boolean not null default true;
alter table insights drop constraint if exists insights_kind_check;
alter table insights add constraint insights_kind_check check (kind is null or kind in ('symptom','function'));
alter table insights drop constraint if exists insights_tracking_check;
alter table insights add constraint insights_tracking_check check (tracking is null or tracking in ('feel','behaviour'));
create unique index if not exists insights_test_key_uq on insights (test_id, key) where key is not null;
-- A goal = an insight with key set. Clients see it when approved, client_visible and the test is published.
drop policy if exists "insights_select_scoped" on insights;
create policy "insights_select_scoped" on insights for select using (
  (owns_test(test_id) and approved and client_visible) or clinician_owns_test(test_id) or is_admin());

create table if not exists insight_evidence (
  id uuid primary key default gen_random_uuid(),
  insight_id uuid not null references insights on delete cascade,
  kind text not null check (kind in ('metric','taxon','food_action')),
  metric_id text references metrics,
  taxon_id text references taxa,
  effect text check (effect in ('too_much','too_little','on_side','in_range')),
  text_en text, text_es text,
  source text not null check (source in ('report','nutritionist','suggestion','elevame_link')),
  source_page text,
  sort_order int not null default 0,
  check ((kind = 'metric' and metric_id is not null) or (kind = 'taxon' and taxon_id is not null and effect is not null)
         or (kind = 'food_action' and text_en is not null))
);
create table if not exists insight_foods (
  insight_id uuid references insights on delete cascade,
  food_id text references foods,
  note_en text, note_es text, source_page text not null,
  sort_order int not null default 0,
  primary key (insight_id, food_id)
);
create or replace function can_read_insight(p_insight_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from insights i where i.id = p_insight_id and (
    (owns_test(i.test_id) and i.approved and i.client_visible) or clinician_owns_test(i.test_id) or is_admin()));
$$;
alter table insight_evidence enable row level security;
alter table insight_foods enable row level security;
drop policy if exists ie_read on insight_evidence;
create policy ie_read on insight_evidence for select using (can_read_insight(insight_id));
drop policy if exists ie_admin on insight_evidence;
create policy ie_admin on insight_evidence for all using (is_admin()) with check (is_admin());
drop policy if exists if_read on insight_foods;
create policy if_read on insight_foods for select using (can_read_insight(insight_id));
drop policy if exists if_admin on insight_foods;
create policy if_admin on insight_foods for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- 7. Plan depth (v1 plan tables, profile keyed)
-- ------------------------------------------------------------
-- plan_phases.blurb_* holds the phase goal (rewritten for one person by the seed).
-- plan_days.tip_* holds "Why today"; hide notes about another person:
alter table plan_days add column if not exists tip_client_visible boolean not null default true;

create table if not exists plan_meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references plan_meals on delete cascade,
  food_id text not null references foods,
  label_en text not null, label_es text,
  plan_score int,                 -- as printed in the plan PDF, audit only; the UI shows food_scores.score
  portion_en text, portion_es text,
  sort_order int not null default 0,
  unique (meal_id, sort_order)
);
create index if not exists plan_meal_items_food_idx on plan_meal_items (food_id);
alter table plan_meal_items enable row level security;
drop policy if exists pmi_read on plan_meal_items;
create policy pmi_read on plan_meal_items for select using (owns_meal(meal_id) or is_staff());
drop policy if exists pmi_admin on plan_meal_items;
create policy pmi_admin on plan_meal_items for all using (is_admin()) with check (is_admin());

create table if not exists phase_focus_foods (
  phase_id uuid references plan_phases on delete cascade,
  food_id text references foods,
  sort_order int not null default 0,
  source_page text not null,
  primary key (phase_id, food_id)
);
create table if not exists phase_habits (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references plan_phases on delete cascade,
  key text not null,                 -- kraut | kraut_daily | cook | season
  text_en text not null, text_es text not null,
  why_en text, why_es text,
  source_page text not null,
  sort_order int not null default 0,
  unique (phase_id, key)
);
create or replace function owns_phase(p_phase_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from plan_phases ph join profiles p on p.id = ph.profile_id
                 where ph.id = p_phase_id and p.user_id = auth.uid());
$$;
alter table phase_focus_foods enable row level security;
alter table phase_habits enable row level security;
drop policy if exists pff_read on phase_focus_foods;
create policy pff_read on phase_focus_foods for select using (owns_phase(phase_id) or is_staff());
drop policy if exists pff_admin on phase_focus_foods;
create policy pff_admin on phase_focus_foods for all using (is_admin()) with check (is_admin());
drop policy if exists ph_read on phase_habits;
create policy ph_read on phase_habits for select using (owns_phase(phase_id) or is_staff());
drop policy if exists ph_admin on phase_habits;
create policy ph_admin on phase_habits for all using (is_admin()) with check (is_admin());

-- Hide day notes about another person from the client.
drop policy if exists "plan_days_select_own" on plan_days;
create policy "plan_days_select_own" on plan_days for select using (
  exists (select 1 from plan_phases where plan_phases.id = plan_days.phase_id and owns_profile(plan_phases.profile_id))
  or is_staff());
-- Row stays readable (the day still has meals); the app must not render tip_* when tip_client_visible is false.
-- Belt and braces: a view the client UI reads instead of plan_days.
create or replace view client_plan_days with (security_invoker = true) as
select id, phase_id, day_index,
       case when tip_client_visible then tip_en end as tip_en,
       case when tip_client_visible then tip_es end as tip_es
from plan_days;

-- ------------------------------------------------------------
-- 8. What the client does (client keyed, owner read and write, staff read)
-- ------------------------------------------------------------
create table if not exists meal_logs (
  client_id uuid not null references clients on delete cascade,
  meal_id uuid not null references plan_meals on delete cascade,
  day date not null,
  status text not null check (status in ('eaten','swapped')),
  created_at timestamptz not null default now(),
  primary key (client_id, meal_id, day)
);
create table if not exists meal_swaps (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  scope text not null check (scope in ('meal','phase')),
  meal_id uuid references plan_meals on delete cascade,       -- scope 'meal'
  day date,                                                   -- scope 'meal'
  phase_id uuid references plan_phases on delete cascade,     -- scope 'phase'
  from_food_id text not null references foods,
  to_food_id text not null references foods,
  created_at timestamptz not null default now(),
  check ((scope = 'meal' and meal_id is not null and day is not null and phase_id is null)
      or (scope = 'phase' and phase_id is not null and meal_id is null and day is null)),
  check (from_food_id <> to_food_id)
);
create unique index if not exists meal_swaps_meal_uq on meal_swaps (client_id, meal_id, day, from_food_id) where scope = 'meal';
create unique index if not exists meal_swaps_phase_uq on meal_swaps (client_id, phase_id, from_food_id) where scope = 'phase';
create table if not exists meal_keepers (
  client_id uuid references clients on delete cascade,
  meal_id uuid references plan_meals on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, meal_id)
);
create table if not exists habit_logs (
  client_id uuid references clients on delete cascade,
  habit_id uuid references phase_habits on delete cascade,
  day date not null,
  primary key (client_id, habit_id, day)
);
create table if not exists shopping_states (
  client_id uuid references clients on delete cascade,
  week_start date not null,
  food_id text references foods,
  state text not null check (state in ('basket','home')),
  updated_at timestamptz not null default now(),
  primary key (client_id, week_start, food_id)
);
create table if not exists my_picks (
  client_id uuid references clients on delete cascade,
  food_id text references foods,
  created_at timestamptz not null default now(),
  primary key (client_id, food_id)
);
create table if not exists habit_swaps (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  week_start date not null,
  from_food_id text not null references foods,
  to_food_id text not null references foods,
  accepted boolean, kept boolean,
  unique (client_id, week_start)
);
create table if not exists quick_checkins (
  client_id uuid not null references clients on delete cascade,
  day date not null,
  digestion int check (digestion between 1 and 5),
  gas int check (gas between 1 and 5),
  energy int check (energy between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (client_id, day)
);

do $$
declare t text;
begin
  foreach t in array array['meal_logs','meal_swaps','meal_keepers','habit_logs','shopping_states','my_picks','habit_swaps','quick_checkins'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_own', t);
    execute format('create policy %I on %I for all using (owns_client(client_id)) with check (owns_client(client_id))', t || '_own', t);
    execute format('drop policy if exists %I on %I', t || '_staff_read', t);
    execute format('create policy %I on %I for select using (clinician_owns_client(client_id) or is_admin())', t || '_staff_read', t);
  end loop;
end $$;

-- Milestone check ins: symptom_checkins.milestone is TEXT
-- ('baseline','end_phase_1','end_phase_2','end_phase_3'); sleep and mood already exist.
alter table symptom_checkins
  add column if not exists kind text not null default 'milestone',
  add column if not exists gas int, add column if not exists heaviness int,
  add column if not exists bowel_comfort int,
  add column if not exists processed_snacks text,
  add column if not exists own_symptom int;
alter table symptom_checkins drop constraint if exists symptom_checkins_kind_check;
alter table symptom_checkins add constraint symptom_checkins_kind_check check (kind in ('milestone','weekly'));
alter table symptom_checkins drop constraint if exists symptom_checkins_scales_check;
alter table symptom_checkins add constraint symptom_checkins_scales_check check (
  coalesce(energy,3) between 1 and 5 and coalesce(digestion,3) between 1 and 5 and coalesce(sleep,3) between 1 and 5
  and coalesce(mood,3) between 1 and 5 and coalesce(gas,3) between 1 and 5 and coalesce(heaviness,3) between 1 and 5
  and coalesce(bowel_comfort,3) between 1 and 5 and coalesce(own_symptom,3) between 1 and 5);
alter table symptom_checkins drop constraint if exists symptom_checkins_snacks_check;
alter table symptom_checkins add constraint symptom_checkins_snacks_check
  check (processed_snacks is null or processed_snacks in ('none','some','often'));
create unique index if not exists symptom_checkins_milestone_uq
  on symptom_checkins (client_id, test_id, milestone) where kind = 'milestone';
-- Staff may read but not write a client's check ins (today the policy lets any staff write any row).
drop policy if exists "symptom_checkins_all_scoped" on symptom_checkins;
drop policy if exists symptom_checkins_own on symptom_checkins;
create policy symptom_checkins_own on symptom_checkins for all using (owns_client(client_id)) with check (owns_client(client_id));
drop policy if exists symptom_checkins_staff_read on symptom_checkins;
create policy symptom_checkins_staff_read on symptom_checkins for select using (clinician_owns_client(client_id) or is_admin());

-- ------------------------------------------------------------
-- 9. Client safe reads of the bacteria behind each pattern
--    (condition tables stay staff only; clients never get conditions.name_*)
-- ------------------------------------------------------------
create or replace function taxon_effect(assoc text, status text)
returns text language sql immutable as $$
  select case
    when status is null or status = 'normal' then 'neutral'
    when assoc = 'positive' and status = 'high' then 'unfavourable'
    when assoc = 'positive' and status in ('low','not_detected') then 'favourable'
    when assoc = 'negative' and status = 'high' then 'favourable'
    when assoc = 'negative' and status in ('low','not_detected') then 'unfavourable'
    when assoc = 'producer' and status = 'high' then 'favourable'
    when assoc = 'producer' and status in ('low','not_detected') then 'unfavourable'
    else 'neutral' end $$;

create or replace function client_pattern_taxa(p_test_id uuid)
returns table (condition_id text, theme_id text, pattern_name_en text, pattern_name_es text,
               taxon_id text, taxon_name text, plain_en text, plain_es text,
               association text, status text, page int, effect text)
language sql stable security definer set search_path = public as $$
  select c.id, c.theme_id, c.pattern_name_en, c.pattern_name_es,
         t.id, t.name, t.plain_en, t.plain_es,
         ct.association, r.status, r.page, taxon_effect(ct.association, r.status)
  from taxon_readings r
  join conditions c on c.id = r.context_id
  join condition_taxa ct on ct.condition_id = c.id and ct.taxon_id = r.taxon_id
  join taxa t on t.id = r.taxon_id
  where r.test_id = p_test_id
    and r.context_type in ('condition','pathway')
    and c.pattern_name_en is not null           -- no client wording yet -> not shown
    and (owns_test(p_test_id) or clinician_owns_test(p_test_id) or is_admin());
$$;

create or replace function client_taxon_summary(p_test_id uuid)
returns table (taxon_id text, taxon_name text, plain_en text, plain_es text, tag text)
language sql stable security definer set search_path = public as $$
  select taxon_id, taxon_name, max(plain_en), max(plain_es),
    case
      when bool_or(effect = 'favourable') and bool_or(effect = 'unfavourable') then 'two_sided'
      when bool_or(effect = 'unfavourable' and association = 'positive') then 'too_much'
      when bool_or(effect = 'unfavourable') then 'too_little'
      when bool_or(effect = 'favourable') then 'on_side'
      else 'in_range' end
  from client_pattern_taxa(p_test_id)
  group by taxon_id, taxon_name;
$$;

revoke all on function client_pattern_taxa(uuid), client_taxon_summary(uuid) from public;
grant execute on function client_pattern_taxa(uuid), client_taxon_summary(uuid) to authenticated;
