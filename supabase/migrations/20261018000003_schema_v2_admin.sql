-- ============================================================
-- v2 admin/review layer — run AFTER schema_v2_data_model.sql.
--
-- Two things:
-- 1. claim_kit() is redefined to also sync the matching v2 `clients`
--    row's auth_user_id. Without this, a client who claims their kit
--    via the v1 flow never becomes resolvable in the v2 tables (the
--    one-time backfill in schema_v2_data_model.sql only ran once, at
--    migration time) — the v2 app views would show nothing for them.
-- 2. Admin write policies: is_admin() was only granted SELECT/UPDATE
--    on a couple of tables so far. The admin review panel needs to
--    insert/update insights, food_review_flags and
--    data_quality_issues, and edit report_comments' show_to_client
--    flag.
--
-- Safe to re-run — every statement is idempotent.
-- ============================================================

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

  -- Keep the v2 identity in sync, if this kit already has one
  -- (every kit does, once schema_v2_data_model.sql's backfill or
  -- seedReportV2.mjs has run for it).
  update clients set auth_user_id = auth.uid()
    where legacy_profile_id = v_profile.id and auth_user_id is null;

  return json_build_object('success', true);
end;
$$;

-- ---- Admin write access ----

drop policy if exists "insights_insert_admin" on insights;
create policy "insights_insert_admin" on insights for insert with check (is_admin());

drop policy if exists "insight_clinician_notes_write_admin" on insight_clinician_notes;
create policy "insight_clinician_notes_write_admin" on insight_clinician_notes for all using (is_admin()) with check (is_admin());

drop policy if exists "food_review_flags_write_admin" on food_review_flags;
create policy "food_review_flags_write_admin" on food_review_flags for all using (is_admin()) with check (is_admin());

drop policy if exists "data_quality_issues_write_admin" on data_quality_issues;
create policy "data_quality_issues_write_admin" on data_quality_issues for all using (is_admin()) with check (is_admin());

drop policy if exists "report_comments_write_admin" on report_comments;
create policy "report_comments_write_admin" on report_comments for all using (is_admin()) with check (is_admin());

-- Admin needs to see every test/client/kit regardless of
-- clinician_clients assignment, and to browse the client/kit list to
-- pick which test to review — tests_select_scoped and
-- clients_select_scoped already grant is_admin() full SELECT, so
-- nothing more is needed there. Kits too (kits_select_scoped already
-- has is_staff()).
