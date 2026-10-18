-- ============================================================
-- Elevame Report Data Model v2
--
-- Additive migration — run this AFTER supabase/schema.sql, on an
-- existing live database. It does NOT touch or drop any existing
-- table (profiles, gut_scores, screening_findings, similar_profiles,
-- foods, plan_*, shopping_checks, tracker_entries, milestones) —
-- those keep powering the app exactly as before. This file only
-- CREATES the new catalogue / per-test / clinician-review tables
-- described in DATA_MODEL_SPEC.md, and backfills `clients`/`kits`/
-- `tests` shell rows from the existing `profiles` table so every
-- current client/kit already has a v2 identity to attach new report
-- data to (see MIGRATION_LOG.md for the full rationale).
--
-- Safe to re-run — every statement is idempotent.
--
-- Scope of this pass: the full v2 schema + RLS is created, and the
-- `clients`/`kits`/`tests`/`source_documents` shell rows are
-- backfilled for every existing profile. Deep per-test content
-- (metric_results, screen_results, etc.) is NOT auto-migrated from
-- the old flat tables for every historical client in this pass —
-- that mapping (old ad-hoc keys -> new catalogue ids) needs a human
-- check per client. It IS fully populated for the new client this
-- migration ships with (kit ELVMWB6271, see scripts/seedReportV2.mjs).
-- ============================================================

-- ------------------------------------------------------------
-- Roles: a tiny staff table drives clinician/admin RLS. Clients
-- need no row here — every signed-in user who isn't staff is a
-- client, scoped to their own data via `clients.auth_user_id`.
-- ------------------------------------------------------------
create table if not exists staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('clinician', 'admin')),
  created_at timestamptz not null default now()
);
alter table staff enable row level security;
drop policy if exists "staff_select_own" on staff;
create policy "staff_select_own" on staff for select using (auth.uid() = user_id);

-- Which clients a clinician is assigned to (admins see everyone,
-- no row needed here for them).
create table if not exists clinician_clients (
  clinician_user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null,
  primary key (clinician_user_id, client_id)
);
alter table clinician_clients enable row level security;

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where user_id = auth.uid() and role = 'admin');
$$;

create or replace function is_clinician()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where user_id = auth.uid() and role in ('clinician', 'admin'));
$$;

-- true when the signed-in user is staff (any role) — used for the
-- many tables where client vs clinician access differs only by a
-- "deny the client entirely" rule, not fine-grained per-client scope.
create or replace function is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select is_admin() or is_clinician();
$$;

-- ===== Catalogue (same for every client) =====

create table if not exists themes (
  id text primary key,
  name_en text not null, name_es text not null,
  client_question_en text, client_question_es text,
  sort_order int not null default 0
);
alter table themes enable row level security;
drop policy if exists "themes_select_all" on themes;
create policy "themes_select_all" on themes for select using (true);

create table if not exists metrics (
  id text primary key,
  theme_id text references themes,
  kind text check (kind in ('headline', 'gut_score')),
  name_en text not null, name_es text not null,
  direction text check (direction in ('higher_better', 'lower_better', 'middle_best', 'below_age', 'flag_high', 'categorical')),
  scale_min numeric, scale_max numeric,
  explanation_en text, explanation_es text,
  audience text not null default 'both' check (audience in ('client', 'clinician', 'both')),
  sort_order int not null default 0
);
alter table metrics enable row level security;
drop policy if exists "metrics_select_scoped" on metrics;
create policy "metrics_select_scoped" on metrics for select using (
  audience in ('both', 'client') or is_staff()
);

create table if not exists taxa (
  id text primary key,
  name text not null,
  rank text check (rank in ('phylum', 'class', 'order', 'family', 'genus', 'species')),
  parent_id text references taxa,
  roles text[] not null default '{}',
  audience text not null default 'clinician' check (audience in ('client', 'clinician', 'both'))
);
alter table taxa enable row level security;
drop policy if exists "taxa_select_scoped" on taxa;
create policy "taxa_select_scoped" on taxa for select using (
  audience in ('both', 'client') or is_staff()
);

create table if not exists conditions (
  id text primary key,
  theme_id text references themes,
  kind text check (kind in ('symptom', 'disease', 'pathway')),
  name_en text not null, name_es text not null,
  explanation_en text, explanation_es text
);
alter table conditions enable row level security;
drop policy if exists "conditions_select_staff" on conditions;
create policy "conditions_select_staff" on conditions for select using (is_staff());

create table if not exists references_lit (
  id int primary key, citation text not null, doi_url text
);
alter table references_lit enable row level security;
drop policy if exists "references_lit_select_staff" on references_lit;
create policy "references_lit_select_staff" on references_lit for select using (is_staff());

create table if not exists condition_taxa (
  condition_id text references conditions,
  taxon_id text references taxa,
  association text check (association in ('positive', 'negative')),
  reference_ids int[] not null default '{}',
  primary key (condition_id, taxon_id)
);
alter table condition_taxa enable row level security;
drop policy if exists "condition_taxa_select_staff" on condition_taxa;
create policy "condition_taxa_select_staff" on condition_taxa for select using (is_staff());

create table if not exists similar_conditions (
  id text primary key, theme_id text references themes,
  name_en text not null, name_es text not null
);
alter table similar_conditions enable row level security;
drop policy if exists "similar_conditions_select_staff" on similar_conditions;
create policy "similar_conditions_select_staff" on similar_conditions for select using (is_staff());

create table if not exists screen_panels (
  id text primary key, name_en text not null, name_es text not null
);
alter table screen_panels enable row level security;
drop policy if exists "screen_panels_select_all" on screen_panels;
create policy "screen_panels_select_all" on screen_panels for select using (true);

create table if not exists screen_items (
  panel_id text references screen_panels,
  taxon_id text references taxa,
  primary key (panel_id, taxon_id)
);
alter table screen_items enable row level security;
drop policy if exists "screen_items_select_all" on screen_items;
create policy "screen_items_select_all" on screen_items for select using (true);

create table if not exists food_categories (
  id text primary key, name_en text not null, name_es text not null,
  sort_order int not null default 0, shopping_list_group text
);
alter table food_categories enable row level security;
drop policy if exists "food_categories_select_all" on food_categories;
create policy "food_categories_select_all" on food_categories for select using (true);

-- NOTE: the v1 `foods` table (static shared catalog with one global
-- `score`, used by the 6-week plan + shopping list) already exists
-- and keeps working unchanged. v2 adds a parallel, nullable link to
-- the new richer category taxonomy without breaking it.
alter table foods add column if not exists category_id text references food_categories;
alter table foods add column if not exists image_url text;
alter table foods add column if not exists family text;
alter table foods add column if not exists common_in_spain boolean not null default true;
alter table foods add column if not exists use_in_plans boolean not null default true;

create table if not exists compound_groups (id text primary key, name_en text not null, name_es text);
alter table compound_groups enable row level security;
drop policy if exists "compound_groups_select_staff" on compound_groups;
create policy "compound_groups_select_staff" on compound_groups for select using (is_staff());

create table if not exists compounds (
  id text primary key, group_id text references compound_groups,
  name text not null, strain text, linked_food_ids text[] not null default '{}'
);
alter table compounds enable row level security;
drop policy if exists "compounds_select_staff" on compounds;
create policy "compounds_select_staff" on compounds for select using (is_staff());

create table if not exists supplements (
  id text primary key,
  type text check (type in ('prebiotic', 'probiotic')),
  product text not null, brand text,
  region text, eu_equivalent_id text references supplements
);
alter table supplements enable row level security;
drop policy if exists "supplements_select_scoped" on supplements;
create policy "supplements_select_scoped" on supplements for select using (
  region = 'EU' or eu_equivalent_id is not null or is_staff()
);

-- ===== Clients, kits, tests =====

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users (id) on delete set null,
  name text, sex text, birth_year int, language text not null default 'es' check (language in ('en', 'es')),
  ghl_contact_id text,
  legacy_profile_id uuid unique,
  created_at timestamptz not null default now()
);
alter table clients enable row level security;
drop policy if exists "clients_select_scoped" on clients;
create policy "clients_select_scoped" on clients for select using (
  auth.uid() = auth_user_id or is_staff()
);

create table if not exists kits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients on delete cascade,
  kit_code text unique not null,
  status text, dispatched_at timestamptz, received_at timestamptz,
  created_at timestamptz not null default now()
);
alter table kits enable row level security;
drop policy if exists "kits_select_scoped" on kits;
create policy "kits_select_scoped" on kits for select using (
  exists (select 1 from clients where clients.id = kits.client_id and clients.auth_user_id = auth.uid())
  or is_staff()
);

create table if not exists tests (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid references kits, client_id uuid references clients on delete cascade,
  test_number int not null default 1, report_date date, age_at_test int,
  parse_status text not null default 'pending' check (parse_status in ('pending', 'parsed', 'legacy', 'failed')),
  reviewed_by uuid references auth.users (id),
  published_at timestamptz,
  legacy_profile_id uuid unique,
  created_at timestamptz not null default now(),
  unique (client_id, test_number)
);
alter table tests enable row level security;

-- A client only ever sees their OWN published tests. Clinicians see
-- tests of clients assigned to them (clinician_clients); admins see
-- everything and can also write (publish / review).
create or replace function owns_test(p_test_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tests t join clients c on c.id = t.client_id
    where t.id = p_test_id and c.auth_user_id = auth.uid() and t.published_at is not null
  );
$$;

create or replace function clinician_owns_test(p_test_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tests t
    join clinician_clients cc on cc.client_id = t.client_id
    where t.id = p_test_id and cc.clinician_user_id = auth.uid()
  );
$$;

drop policy if exists "tests_select_scoped" on tests;
create policy "tests_select_scoped" on tests for select using (
  owns_test(id) or clinician_owns_test(id) or is_admin()
);
drop policy if exists "tests_update_admin" on tests;
create policy "tests_update_admin" on tests for update using (is_admin()) with check (is_admin());

create table if not exists source_documents (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests on delete cascade,
  type text check (type in ('doctor', 'user')),
  storage_path text not null, enbiosis_version text, parsed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table source_documents enable row level security;
drop policy if exists "source_documents_select_staff" on source_documents;
create policy "source_documents_select_staff" on source_documents for select using (
  clinician_owns_test(test_id) or is_admin()
);

-- ===== Per-test analysis results =====

create table if not exists metric_results (
  test_id uuid references tests on delete cascade,
  metric_id text references metrics,
  value numeric, value_text text, community_value numeric,
  printed_badge text check (printed_badge in ('good', 'watch', 'act')),
  computed_status text, printed_comment text,
  source_document_id uuid references source_documents, page int,
  primary key (test_id, metric_id)
);
alter table metric_results enable row level security;
drop policy if exists "metric_results_select_scoped" on metric_results;
create policy "metric_results_select_scoped" on metric_results for select using (
  owns_test(test_id) or clinician_owns_test(test_id) or is_admin()
);

create table if not exists metric_markers (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests on delete cascade,
  metric_id text references metrics,
  label_en text, value numeric
);
alter table metric_markers enable row level security;
drop policy if exists "metric_markers_select_scoped" on metric_markers;
create policy "metric_markers_select_scoped" on metric_markers for select using (
  owns_test(test_id) or clinician_owns_test(test_id) or is_admin()
);

create table if not exists genus_abundance (
  test_id uuid references tests on delete cascade,
  taxon_id text references taxa, client_pct numeric, world_pct numeric,
  primary key (test_id, taxon_id)
);
alter table genus_abundance enable row level security;
drop policy if exists "genus_abundance_select_scoped" on genus_abundance;
create policy "genus_abundance_select_scoped" on genus_abundance for select using (
  owns_test(test_id) or clinician_owns_test(test_id) or is_admin()
);

create table if not exists key_bacteria (
  test_id uuid references tests on delete cascade,
  taxon_id text references taxa, client_score numeric, community_score numeric,
  primary key (test_id, taxon_id)
);
alter table key_bacteria enable row level security;
drop policy if exists "key_bacteria_select_scoped" on key_bacteria;
create policy "key_bacteria_select_scoped" on key_bacteria for select using (
  owns_test(test_id) or clinician_owns_test(test_id) or is_admin()
);

create table if not exists krona_abundance (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests on delete cascade,
  taxon_id text references taxa, pct numeric
);
alter table krona_abundance enable row level security;
drop policy if exists "krona_abundance_select_staff" on krona_abundance;
create policy "krona_abundance_select_staff" on krona_abundance for select using (
  clinician_owns_test(test_id) or is_admin()
);

create table if not exists taxon_readings (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests on delete cascade,
  taxon_id text references taxa,
  context_type text check (context_type in ('screen', 'condition', 'pathway')),
  context_id text,
  status text check (status in ('not_detected', 'low', 'normal', 'high')),
  abundance_pct numeric, page int
);
alter table taxon_readings enable row level security;
drop policy if exists "taxon_readings_select_staff" on taxon_readings;
create policy "taxon_readings_select_staff" on taxon_readings for select using (
  clinician_owns_test(test_id) or is_admin()
);

create table if not exists taxon_status (
  test_id uuid references tests on delete cascade,
  taxon_id text references taxa,
  status text, rule_applied text, has_conflict boolean not null default false,
  primary key (test_id, taxon_id)
);
alter table taxon_status enable row level security;
drop policy if exists "taxon_status_select_scoped" on taxon_status;
create policy "taxon_status_select_scoped" on taxon_status for select using (
  owns_test(test_id) or clinician_owns_test(test_id) or is_admin()
);

create table if not exists condition_results (
  test_id uuid references tests on delete cascade,
  condition_id text references conditions,
  at_risk boolean, flagged_taxon_ids text[] not null default '{}', printed_text text,
  primary key (test_id, condition_id)
);
alter table condition_results enable row level security;
drop policy if exists "condition_results_select_staff" on condition_results;
create policy "condition_results_select_staff" on condition_results for select using (
  clinician_owns_test(test_id) or is_admin()
);

create table if not exists similar_profile_results (
  test_id uuid references tests on delete cascade,
  similar_condition_id text references similar_conditions,
  client_pct numeric, overall_pct numeric,
  primary key (test_id, similar_condition_id)
);
alter table similar_profile_results enable row level security;
drop policy if exists "similar_profile_results_select_staff" on similar_profile_results;
create policy "similar_profile_results_select_staff" on similar_profile_results for select using (
  clinician_owns_test(test_id) or is_admin()
);

create table if not exists screen_results (
  test_id uuid references tests on delete cascade,
  panel_id text not null, taxon_id text not null,
  status text, abundance_pct numeric,
  foreign key (panel_id, taxon_id) references screen_items (panel_id, taxon_id),
  primary key (test_id, panel_id, taxon_id)
);
alter table screen_results enable row level security;
drop policy if exists "screen_results_select_scoped" on screen_results;
create policy "screen_results_select_scoped" on screen_results for select using (
  owns_test(test_id) or clinician_owns_test(test_id) or is_admin()
);

-- ===== Per-test nutrition results =====

create table if not exists food_scores (
  test_id uuid references tests on delete cascade,
  food_id text references foods,
  score int check (score between 0 and 10),
  band text generated always as (
    case when score >= 8 then 'prioritise' when score >= 4 then 'include' else 'reduce' end
  ) stored,
  primary key (test_id, food_id)
);
alter table food_scores enable row level security;
drop policy if exists "food_scores_select_scoped" on food_scores;
create policy "food_scores_select_scoped" on food_scores for select using (
  owns_test(test_id) or clinician_owns_test(test_id) or is_admin()
);

create table if not exists food_highlights (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests on delete cascade,
  food_id text references foods,
  list text check (list in ('top', 'fit', 'avoid')), position int
);
alter table food_highlights enable row level security;
drop policy if exists "food_highlights_select_scoped" on food_highlights;
create policy "food_highlights_select_scoped" on food_highlights for select using (
  owns_test(test_id) or clinician_owns_test(test_id) or is_admin()
);

create table if not exists compound_scores (
  test_id uuid references tests on delete cascade,
  compound_id text references compounds, score int,
  primary key (test_id, compound_id)
);
alter table compound_scores enable row level security;
drop policy if exists "compound_scores_select_staff" on compound_scores;
create policy "compound_scores_select_staff" on compound_scores for select using (
  clinician_owns_test(test_id) or is_admin()
);

create table if not exists supplement_scores (
  test_id uuid references tests on delete cascade,
  supplement_id text references supplements, score numeric,
  primary key (test_id, supplement_id)
);
alter table supplement_scores enable row level security;
drop policy if exists "supplement_scores_select_scoped" on supplement_scores;
create policy "supplement_scores_select_scoped" on supplement_scores for select using (
  owns_test(test_id) or clinician_owns_test(test_id) or is_admin()
);

create table if not exists report_comments (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests on delete cascade,
  section_key text not null,
  metric_id text references metrics, condition_id text references conditions,
  text text not null, language text not null default 'en' check (language in ('en', 'es')),
  source_document_id uuid references source_documents, page int,
  show_to_client boolean not null default false
);
alter table report_comments enable row level security;
drop policy if exists "report_comments_select_scoped" on report_comments;
create policy "report_comments_select_scoped" on report_comments for select using (
  (owns_test(test_id) and show_to_client) or clinician_owns_test(test_id) or is_admin()
);

-- ===== Elevame layer (written by us, not Enbiosis) =====

create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests on delete cascade,
  theme_id text references themes,
  status text check (status in ('good', 'watch', 'act')),
  title_en text, title_es text,
  client_text_en text, client_text_es text,
  linked_metric_ids text[] not null default '{}', linked_taxon_ids text[] not null default '{}',
  linked_condition_ids text[] not null default '{}', linked_food_ids text[] not null default '{}',
  author text check (author in ('ai', 'nutritionist')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table insights enable row level security;
drop policy if exists "insights_select_scoped" on insights;
create policy "insights_select_scoped" on insights for select using (
  (owns_test(test_id) and approved) or clinician_owns_test(test_id) or is_admin()
);
drop policy if exists "insights_update_admin" on insights;
create policy "insights_update_admin" on insights for update using (is_admin()) with check (is_admin());

-- clinician-only extra text kept in a separate table so client RLS
-- can never see it even if the app ever selects `insights.*`.
create table if not exists insight_clinician_notes (
  insight_id uuid primary key references insights on delete cascade,
  clinician_text text
);
alter table insight_clinician_notes enable row level security;
drop policy if exists "insight_clinician_notes_select_staff" on insight_clinician_notes;
create policy "insight_clinician_notes_select_staff" on insight_clinician_notes for select using (is_staff());

create table if not exists food_review_flags (
  test_id uuid references tests on delete cascade,
  food_id text references foods,
  reason text, theme_id text references themes,
  action text check (action in ('hide', 'annotate', 'keep')),
  note_en text, note_es text, reviewed_by uuid references auth.users (id),
  primary key (test_id, food_id)
);
alter table food_review_flags enable row level security;
drop policy if exists "food_review_flags_select_scoped" on food_review_flags;
create policy "food_review_flags_select_scoped" on food_review_flags for select using (
  owns_test(test_id) or clinician_owns_test(test_id) or is_admin()
);

create table if not exists client_intolerances (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients on delete cascade,
  food_id text references foods, family text,
  severity text, source text check (source in ('consultation', 'symptom_tracker')),
  created_at timestamptz not null default now()
);
alter table client_intolerances enable row level security;
drop policy if exists "client_intolerances_select_scoped" on client_intolerances;
create policy "client_intolerances_select_scoped" on client_intolerances for select using (
  exists (select 1 from clients where clients.id = client_intolerances.client_id and clients.auth_user_id = auth.uid())
  or is_staff()
);

create table if not exists data_quality_issues (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests on delete cascade,
  issue_type text, detail text,
  taxon_id text, metric_id text, resolved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table data_quality_issues enable row level security;
drop policy if exists "data_quality_issues_select_staff" on data_quality_issues;
create policy "data_quality_issues_select_staff" on data_quality_issues for select using (
  clinician_owns_test(test_id) or is_admin()
);

create table if not exists symptom_checkins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients on delete cascade,
  test_id uuid references tests,
  milestone text check (milestone in ('baseline', 'end_phase_1', 'end_phase_2', 'end_phase_3')),
  energy int, digestion int, sleep int, mood int, bloating boolean, notes text,
  created_at timestamptz not null default now()
);
alter table symptom_checkins enable row level security;
drop policy if exists "symptom_checkins_all_scoped" on symptom_checkins;
create policy "symptom_checkins_all_scoped" on symptom_checkins for all using (
  exists (select 1 from clients where clients.id = symptom_checkins.client_id and clients.auth_user_id = auth.uid())
  or is_staff()
) with check (
  exists (select 1 from clients where clients.id = symptom_checkins.client_id and clients.auth_user_id = auth.uid())
  or is_staff()
);

-- ------------------------------------------------------------
-- Backfill: give every existing profile a v2 identity shell
-- (clients/kits/tests) so new report data has somewhere to attach.
-- Idempotent via the legacy_profile_id unique columns above.
-- ------------------------------------------------------------
insert into clients (auth_user_id, name, language, legacy_profile_id)
select p.user_id, p.full_name, p.language, p.id
from profiles p
where not exists (select 1 from clients c where c.legacy_profile_id = p.id);

insert into kits (client_id, kit_code, status)
select c.id, p.kit_code, case when p.claimed_at is not null then 'claimed' else 'unclaimed' end
from profiles p
join clients c on c.legacy_profile_id = p.id
where not exists (select 1 from kits k where k.kit_code = p.kit_code);

insert into tests (kit_id, client_id, test_number, report_date, parse_status, published_at, legacy_profile_id)
select k.id, c.id, 1, p.plan_start_date, 'legacy', coalesce(p.claimed_at, p.created_at), p.id
from profiles p
join clients c on c.legacy_profile_id = p.id
join kits k on k.kit_code = p.kit_code
where not exists (select 1 from tests t where t.legacy_profile_id = p.id);
