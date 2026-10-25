-- ============================================================
-- Elevame redesign, cycle 7: adoption summary for the nutritionist
-- Run AFTER 20261020_redesign.sql. Additive and idempotent. No new table.
--
-- adoption_weekly(client_id) returns one row per plan week (1 to 6) with what
-- the client actually did: meals followed (eaten or swapped), swaps made, days
-- with a habit ticked, daily taps, foods starred, plus the milestone check in
-- done that week. It answers "is this client adopting the plan or the habits?"
-- for the admin panel without reading raw logs one by one.
-- Who can call it: the client (own rows), their clinician, admins. Anyone else
-- gets zero rows.
-- ============================================================

create or replace function adoption_weekly(p_client_id uuid)
returns table (
  week int, week_start date, week_end date,
  meals_followed int, meals_planned int,
  swaps_made int, habit_days int, daily_taps int, picks_added int,
  milestone text
)
language sql stable security definer set search_path = public as $$
  with c as (
    select cl.id as client_id, p.plan_start_date as start
    from clients cl join profiles p on p.id = cl.legacy_profile_id
    where cl.id = p_client_id
      and (owns_client(p_client_id) or clinician_owns_client(p_client_id) or is_admin())
  ), w as (
    select c.client_id, g as week, c.start + (g - 1) * 7 as ws, c.start + g * 7 - 1 as we
    from c, generate_series(1, 6) g
  )
  select w.week, w.ws, w.we,
    (select count(*) from meal_logs l where l.client_id = w.client_id and l.day between w.ws and w.we)::int,
    28,
    (select count(*) from meal_swaps s where s.client_id = w.client_id and s.created_at::date between w.ws and w.we)::int,
    (select count(distinct h.day) from habit_logs h where h.client_id = w.client_id and h.day between w.ws and w.we)::int,
    (select count(*) from quick_checkins q where q.client_id = w.client_id and q.day between w.ws and w.we)::int,
    (select count(*) from my_picks m where m.client_id = w.client_id and m.created_at::date between w.ws and w.we)::int,
    (select string_agg(sc.milestone, ', ') from symptom_checkins sc
       where sc.client_id = w.client_id and sc.kind = 'milestone' and sc.created_at::date between w.ws and w.we)
  from w order by w.week;
$$;

revoke all on function adoption_weekly(uuid) from public;
grant execute on function adoption_weekly(uuid) to authenticated;
