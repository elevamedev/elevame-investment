-- Cycle 14: carry each client's v1 history into the v4 tables, so nobody loses their check ins on launch day.
-- Runs once at cut over (safe to rerun: nothing is copied twice). v1 tables stay read only until decision D-14 says drop them.
--   tracker_entries (profile, date, 1 to 5 scales, bloating yes/no)  ->  quick_checkins (client, day, 1 to 5 scales)
--   milestones (baseline, phase1End ... phase3End)                    ->  symptom_checkins kind 'milestone'
-- quick_checkins.bloating is a 1 to 5 scale and v1 stored yes or no, so it is left empty rather than guessed.
begin;
alter table symptom_checkins add column if not exists legacy_ref text unique;   -- v1 milestone row it came from

insert into quick_checkins (client_id, day, digestion, energy, sleep, mood, created_at)
select c.id, t.date, t.digestion, t.energy, t.sleep, t.mood, coalesce(t.updated_at, t.date::timestamptz)
from tracker_entries t join clients c on c.legacy_profile_id = t.profile_id
where t.date is not null
on conflict (client_id, day) do nothing;   -- a v4 answer for the same day wins

insert into symptom_checkins (client_id, test_id, kind, milestone, energy, digestion, sleep, mood, bloating, notes, created_at, legacy_ref)
select c.id,
  coalesce((select x.id from tests x where x.client_id = c.id and x.published_at is not null and x.report_date <= m.date order by x.report_date desc limit 1),
           (select x.id from tests x where x.client_id = c.id order by x.test_number limit 1)),
  'milestone',
  case m.milestone_id when 'baseline' then 'baseline' when 'phase1End' then 'end_phase_1' when 'phase2End' then 'end_phase_2' when 'phase3End' then 'end_phase_3' end,
  m.energy, m.digestion, m.sleep, m.mood, m.bloating, m.notes, coalesce(m.date::timestamptz, m.updated_at),
  'milestones:' || m.profile_id || ':' || m.milestone_id
from milestones m join clients c on c.legacy_profile_id = m.profile_id
where m.milestone_id in ('baseline', 'phase1End', 'phase2End', 'phase3End')
on conflict (legacy_ref) do nothing;

-- the greeting name: first word of the v1 profile name, staff can change it
do $$ begin
  if exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'full_name') then
    execute $q$update clients c set preferred_name = split_part(trim(p.full_name), ' ', 1)
             from profiles p where p.id = c.legacy_profile_id and c.preferred_name is null and coalesce(trim(p.full_name), '') <> ''$q$;
  end if;
end $$;
commit;
