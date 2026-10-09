-- ============================================================
-- Elevame client app — Supabase schema
--
-- Run this against a fresh Supabase project (SQL Editor, or
-- `supabase db push` if you use the Supabase CLI). It creates
-- every table the app reads from and writes to, plus Row Level
-- Security policies so each client can only ever see their own
-- records. The `foods` table is shared reference data (the food
-- score catalog) and is world-readable but not writable from the
-- browser. Safe to re-run — every statement is idempotent.
--
-- Kit / account model
-- --------------------
-- A `profiles` row is NOT the same thing as a Supabase Auth user.
-- Staff create a profile (kit code + report data) the moment a
-- client's lab results are ready, via `npm run register-kit` —
-- before that client has ever signed up. `profiles.user_id` stays
-- NULL until the client creates their own account and claims their
-- kit code (see the `claim_kit` function below), which is what
-- actually links a login to a report. `profiles.id` is therefore
-- an internal id, separate from `auth.users.id`; every other table
-- below references profiles by that internal id, and RLS checks
-- ownership by joining through `profiles.user_id = auth.uid()`.
--
-- For an account staff create and hand to a client ready-to-use
-- (no self-serve claim needed), `npm run seed` still works — it
-- just sets `user_id` immediately instead of leaving it NULL.
-- ============================================================

-- ------------------------------------------------------------
-- profiles: one row per client report. Unclaimed until a client
-- signs up and links their kit code to their own Supabase Auth
-- account (user_id).
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  kit_code text not null unique,
  expected_email text not null,
  full_name text not null,
  language text not null default 'en' check (language in ('en', 'es')),
  plan_start_date date not null default current_date,
  microbiome_age numeric,
  diversity_value numeric,
  diversity_max numeric default 10,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Migrate a `profiles` table created by an older version of this
-- schema (where id WAS the auth user id, and kit_code/expected_email
-- didn't exist yet) to the shape above. No-ops on a brand new
-- database, where the table was just created with these columns
-- already in place.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'user_id'
  ) then
    alter table profiles add column user_id uuid unique references auth.users (id) on delete set null;
    update profiles set user_id = id where user_id is null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'expected_email'
  ) then
    alter table profiles add column expected_email text;
    update profiles set expected_email = coalesce(
      (select email from auth.users where auth.users.id = profiles.user_id),
      'unknown@elevame.es'
    ) where expected_email is null;
    alter table profiles alter column expected_email set not null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'claimed_at'
  ) then
    alter table profiles add column claimed_at timestamptz;
    update profiles set claimed_at = created_at where claimed_at is null and user_id is not null;
  end if;

  -- Older schema allowed kit_code to be null; the new model
  -- requires one (it's what clients claim their report with).
  if exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'kit_code' and is_nullable = 'YES'
  ) then
    update profiles set kit_code = 'MIGRATED-' || substr(id::text, 1, 8) where kit_code is null;
    alter table profiles alter column kit_code set not null;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_kit_code_key' and conrelid = 'profiles'::regclass
  ) then
    alter table profiles add constraint profiles_kit_code_key unique (kit_code);
  end if;

  -- id used to BE the auth user id (a direct FK to auth.users). It
  -- is now an independent internal id, decoupled so a profile can
  -- exist before its client has ever signed up — drop that old FK.
  if exists (
    select 1 from pg_constraint
    where conname = 'profiles_id_fkey' and conrelid = 'profiles'::regclass
  ) then
    alter table profiles drop constraint profiles_id_fkey;
  end if;
end $$;

alter table profiles enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Helper used by every other table's RLS policies below: true when
-- the given profiles.id belongs to the signed-in user.
create or replace function owns_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = p_profile_id and user_id = auth.uid()
  );
$$;

-- ------------------------------------------------------------
-- claim_kit: the only way a `profiles` row's user_id ever gets
-- set from the browser. Call as the signed-in client with the kit
-- code and the email their lab results were registered under.
-- Row-locks the match so two people racing on the same code can't
-- both succeed, and refuses to run if this account already claimed
-- a different kit.
-- ------------------------------------------------------------
create or replace function claim_kit(p_kit_code text, p_email text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from profiles where user_id = auth.uid()) then
    return json_build_object('success', false, 'error', 'already_claimed');
  end if;

  select * into v_profile from profiles
    where kit_code = p_kit_code and user_id is null
    for update;

  if not found then
    return json_build_object('success', false, 'error', 'not_found');
  end if;

  if lower(v_profile.expected_email) <> lower(p_email) then
    return json_build_object('success', false, 'error', 'email_mismatch');
  end if;

  update profiles
    set user_id = auth.uid(), claimed_at = now()
    where id = v_profile.id and user_id is null;

  return json_build_object('success', true);
end;
$$;

grant execute on function claim_kit(text, text) to authenticated;

-- ------------------------------------------------------------
-- foods: shared score catalog, same for every client.
-- Read-only from the browser — only the service role (used by
-- the seed/register-kit scripts) can write to it.
-- ------------------------------------------------------------
create table if not exists foods (
  id text primary key,
  category text not null check (category in ('produce', 'grains', 'dairy', 'nuts', 'herbs')),
  score int not null check (score between 0 and 10),
  name_en text not null,
  name_es text not null
);

alter table foods enable row level security;

drop policy if exists "foods_select_all" on foods;
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

drop policy if exists "gut_scores_select_own" on gut_scores;
create policy "gut_scores_select_own" on gut_scores
  for select using (owns_profile(profile_id));

-- ------------------------------------------------------------
-- plan_phases / plan_days / plan_meals: a client's 6-week plan.
-- Nutritionists edit these (via the Supabase table editor, or a
-- future admin tool) to personalise a client's plan beyond the
-- starter template the seed/register-kit scripts assign.
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

drop policy if exists "plan_phases_select_own" on plan_phases;
create policy "plan_phases_select_own" on plan_phases
  for select using (owns_profile(profile_id));

create table if not exists plan_days (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references plan_phases (id) on delete cascade,
  day_index int not null,
  tip_en text,
  tip_es text,
  unique (phase_id, day_index)
);

alter table plan_days enable row level security;

drop policy if exists "plan_days_select_own" on plan_days;
create policy "plan_days_select_own" on plan_days
  for select using (
    exists (
      select 1 from plan_phases
      where plan_phases.id = plan_days.phase_id
        and owns_profile(plan_phases.profile_id)
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

drop policy if exists "plan_meals_select_own" on plan_meals;
create policy "plan_meals_select_own" on plan_meals
  for select using (
    exists (
      select 1 from plan_days
      join plan_phases on plan_phases.id = plan_days.phase_id
      where plan_days.id = plan_meals.day_id
        and owns_profile(plan_phases.profile_id)
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

drop policy if exists "shopping_checks_all_own" on shopping_checks;
create policy "shopping_checks_all_own" on shopping_checks
  for all using (owns_profile(profile_id))
  with check (owns_profile(profile_id));

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

drop policy if exists "tracker_entries_all_own" on tracker_entries;
create policy "tracker_entries_all_own" on tracker_entries
  for all using (owns_profile(profile_id))
  with check (owns_profile(profile_id));

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

drop policy if exists "milestones_all_own" on milestones;
create policy "milestones_all_own" on milestones
  for all using (owns_profile(profile_id))
  with check (owns_profile(profile_id));
