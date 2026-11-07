-- Phase P (brief 4.11, 6.5): small gaps the brief assumes but no earlier
-- migration added. Idempotent, one transaction.
begin;

-- ------------------------------------------------------------------ 1. nutritionist contact
-- Brief 4.11: "Message my nutritionist (mailto: the clinician's email),
-- kit code and nutritionist name". `staff` had no name/email to show a
-- client; the seed has no clinician assigned to any client yet, so the
-- app falls back to a generic contact when this returns no row.
alter table staff add column if not exists display_name text;
alter table staff add column if not exists contact_email text;

create or replace function my_nutritionist_contact() returns table(display_name text, contact_email text)
language sql stable security definer set search_path = public as $$
  select s.display_name, s.contact_email
  from clinician_clients cc
  join staff s on s.user_id = cc.clinician_user_id
  where cc.client_id in (select my_client_ids())
  limit 1 $$;
revoke execute on function my_nutritionist_contact() from public, anon;
grant execute on function my_nutritionist_contact() to authenticated;

-- ------------------------------------------------------------------ 2. deletion record (GDPR Art. 30 processing record)
-- Brief 6.5: "writes a deletion record (date and client id only)". Not a
-- foreign key to clients: the row it names is gone by the time anyone
-- reads this back. Written by the delete-account Edge Function with the
-- service key, never by a client.
create table if not exists deletion_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  deleted_at timestamptz not null default now()
);
alter table deletion_log enable row level security;
drop policy if exists deletion_log_admin on deletion_log;
create policy deletion_log_admin on deletion_log for select to authenticated using ((select is_admin()));

commit;
