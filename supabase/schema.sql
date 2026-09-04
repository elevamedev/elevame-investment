-- ============================================================
-- Elevame client app — Supabase schema
--
-- Run this once against a fresh Supabase project (SQL Editor,
-- or `supabase db push` if you use the Supabase CLI). It creates
-- every table the app reads from and writes to, plus Row Level
-- Security policies so each client can only ever see their own
-- records. The `foods` table is shared reference data (the food
-- score catalog) and is world-readable but not writable from the
-- browser.
--
-- After running this, use `npm run seed` (scripts/seed.mjs) to
-- create a login + starter plan for your first real client.
-- ============================================================

-- ------------------------------------------------------------
-- profiles: one row per client, keyed by their Supabase Auth id
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  kit_code text,
  language text not null default 'en' check (language in ('en', 'es')),
  plan_start_date date not null default current_date,
  microbiome_age numeric,
  diversity_value numeric,
  diversity_max numeric default 10,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- ------------------------------------------------------------
-- foods: shared score catalog, same for every client.
-- Read-only from the browser — only the service role (used by
-- scripts/seed.mjs) can write to it.
-- ------------------------------------------------------------
create table if not exists foods (
  id text primary key,
  category text not null check (category in ('produce', 'grains', 'dairy', 'nuts', 'herbs')),
  score int not null check (score between 0 and 10),
  name_en text not null,
  name_es text not null
);

alter table foods enable row level security;

create policy "foods_select_all" on foods
  for select using (true);

-- ------------------------------------------------------------
-- gut_scores: a client's microbiome report results.
-- category distinguishes the main gut-score panel from the
-- key-bacteria panel; both render with the same component.
-- ------------------------------------------------------------
create table if not exists gut_scores (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  category text not null check (category in ('gut_score', 'key_bacteria')),
  key text not null,
  label_en text not null,
  label_es text not null,
  value numeric not null,
  avg numeric,
  tag text not null check (tag in ('focus', 'strength', 'onTrack')),
  note_en text,
  note_es text,
  sort_order int not null default 0,
  unique (profile_id, category, key)
);

alter table gut_scores enable row level security;

create policy "gut_scores_select_own" on gut_scores
  for select using (auth.uid() = profile_id);

-- ------------------------------------------------------------
-- plan_phases / plan_days / plan_meals: a client's 6-week plan.
-- Nutritionists edit these (via the Supabase table editor, or a
-- future admin tool) to personalise a client's plan beyond the
-- starter template scripts/seed.mjs assigns.
-- ------------------------------------------------------------
create table if not exists plan_phases (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  phase_index int not null,
  phase_key text not null,
  weeks_en text not null,
  weeks_es text not null,
  subtitle_en text not null,
  subtitle_es text not null,
  blurb_en text not null,
  blurb_es text not null,
  start_day int not null,
  unique (profile_id, phase_index)
);

alter table plan_phases enable row level security;

create policy "plan_phases_select_own" on plan_phases
  for select using (auth.uid() = profile_id);

create table if not exists plan_days (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references plan_phases (id) on delete cascade,
  day_index int not null,
  tip_en text,
  tip_es text,
  unique (phase_id, day_index)
);

alter table plan_days enable row level security;

create policy "plan_days_select_own" on plan_days
  for select using (
    exists (
      select 1 from plan_phases
      where plan_phases.id = plan_days.phase_id
        and plan_phases.profile_id = auth.uid()
    )
  );

create table if not exists plan_meals (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references plan_days (id) on delete cascade,
  meal_order int not null default 0,
  label_key text not null check (label_key in ('breakfast', 'lunch', 'dinner', 'snack')),
  dish_en text not null,
  dish_es text not null,
  desc_en text,
  desc_es text,
  foods text[] not null default '{}'
);

alter table plan_meals enable row level security;

create policy "plan_meals_select_own" on plan_meals
  for select using (
    exists (
      select 1 from plan_days
      join plan_phases on plan_phases.id = plan_days.phase_id
      where plan_days.id = plan_meals.day_id
        and plan_phases.profile_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- shopping_checks: which grocery items a client has ticked off,
-- per phase. One row per (profile, phase, food).
-- ------------------------------------------------------------
create table if not exists shopping_checks (
  profile_id uuid not null references profiles (id) on delete cascade,
  phase_key text not null,
  food_id text not null references foods (id),
  checked boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (profile_id, phase_key, food_id)
);

alter table shopping_checks enable row level security;

create policy "shopping_checks_all_own" on shopping_checks
  for all using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ------------------------------------------------------------
-- tracker_entries: the optional daily check-in.
-- ------------------------------------------------------------
create table if not exists tracker_entries (
  profile_id uuid not null references profiles (id) on delete cascade,
  date date not null,
  energy int not null check (energy between 1 and 5),
  digestion int not null check (digestion between 1 and 5),
  sleep int not null check (sleep between 1 and 5),
  mood int not null check (mood between 1 and 5),
  bloating boolean not null default false,
  notes text default '',
  updated_at timestamptz not null default now(),
  primary key (profile_id, date)
);

alter table tracker_entries enable row level security;

create policy "tracker_entries_all_own" on tracker_entries
  for all using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ------------------------------------------------------------
-- milestones: the day 1 / 14 / 28 / 42 check-ins.
-- ------------------------------------------------------------
create table if not exists milestones (
  profile_id uuid not null references profiles (id) on delete cascade,
  milestone_id text not null,
  date date not null default current_date,
  energy int not null check (energy between 1 and 5),
  digestion int not null check (digestion between 1 and 5),
  sleep int not null check (sleep between 1 and 5),
  mood int not null check (mood between 1 and 5),
  bloating boolean not null default false,
  notes text default '',
  updated_at timestamptz not null default now(),
  primary key (profile_id, milestone_id)
);

alter table milestones enable row level security;

create policy "milestones_all_own" on milestones
  for all using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
