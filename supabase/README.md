# Database setup

## Local / CI (no client data, no live project needed)

```
npm run db:test
```

Rebuilds a throwaway Postgres 16 database from scratch and checks:
- every migration in `migrations/` applies, twice (idempotency);
- `seed.sql` (static catalogue: themes, metrics, screen panels, food
  categories, conditions, plus their client-facing wording — no client
  data) applies, twice;
- `tests/rls_hygiene.sql`: 7 structural RLS/security checks that need
  no client data (every policy is `to authenticated`, no per-row helper
  left in a policy, anon can run no privileged function, every foreign
  key is indexed, every app view runs with the reader's rights, every
  privileged/trigger function pins its `search_path`).

`tests/local_auth_stub.sql` mimics the parts of Supabase Auth
(`auth.users`, `auth.uid()`, the `authenticated`/`anon` roles) the
schema needs, so this runs on plain Postgres with no Supabase CLI
Docker stack. It carries no client or project data.

## Bringing up a real environment (staging or production)

1. Apply `migrations/` in order (`supabase db push`, or run each file
   through `psql` in filename order — they're already timestamped).
   `migrations/20261019000000_catalogue.sql` is generated from
   `scripts/lib/catalogV2.mjs` by `scripts/generateCatalogMigration.mjs`
   — re-run the generator (never hand-edit the migration) whenever the
   catalogue source changes.
2. Apply `seed.sql` (catalogue wording extensions: condition pattern
   names, reference-marker labels, score-to-pattern links, shopping
   aisles).
3. Register each real client: set `ELEVAME_CLIENT_DATA_DIR` to a local,
   untracked copy of that client's extracted report JSON, then run
   `node scripts/seedReportV2.mjs` followed by
   `node scripts/registerKitFromV2.mjs`. **Never** commit that data or
   point `ELEVAME_CLIENT_DATA_DIR` at a path inside this repo.
4. Optionally, once a client's report is seeded, apply
   `seed_client_report_overlay.sql` for plain-language bacterium text
   and curated swap pairs — it only touches rows (`taxa`, `foods`) a
   seeded report creates, so it's a no-op for ids that client's report
   doesn't mention. The swap-pairs portion is Phase D's feature; the
   data layer is ready now so Phase D doesn't need a migration of its
   own for it.

The full 158-check acceptance suite and the 200-value source
comparison (`scripts/test_cycle14.sh`, `scripts/verify_seed_against_sources.py`
in `elevamedev/elevame-redesign`) assert against one real client's
seeded report. That data must never live in this repo, so that suite
runs from the private `elevame-redesign` checkout instead, with
`APP=/path/to/elevame-investment`:

```
APP=/path/to/elevame-investment bash scripts/test_cycle14.sh
python3 scripts/verify_seed_against_sources.py
```

## Cutover: carrying v1 clients into v4 (Phase M)

`migrations/20261024000003_migrate_v1_history.sql` is already in the
chain above — it's a normal migration, not a separate step. It carries
each v1 client's `tracker_entries` into `quick_checkins` and their
`milestones` into milestone `symptom_checkins` with v4 names, linked to
the test current at the time, and sets an initial `preferred_name` from
the first word of the profile name. It's safe to re-run (a v4 answer
for the same day always wins), and it's covered by the "v1 history"
checks in `scripts/test_cycle14.sh` (already passing).

What's left is operational, not code: at cutover, run the full
migration chain (including this file) on staging, confirm there, then
run it on production. Afterwards, staff should check each existing
client's `preferred_name` (correct it where the first word of their
full name isn't what they go by — e.g. "El Hachemi Abdelhak" defaults
to "El") and confirm their current client's baseline phase check-in
shows up correctly in "Digestion when you started" on their Gut lining
page. Both of those need a live project/database this session doesn't
have access to.

## Steps that need the live hosted Supabase project (dashboard or
## Management API access this session doesn't have)

These are brief requirements that can't be verified from a local
checkout — whoever holds the project's dashboard access needs to set
them once:

- **Auth settings:** minimum password length 8 and leaked-password
  protection on (Authentication > Policies). `supabase/config.toml`
  sets the local-dev equivalent; it has no effect on the hosted
  project.
- **Custom SMTP** (Authentication > Email): the built-in sender is
  limited to 2 emails/hour, too low for production.
- **Email templates:** Confirm signup and Reset password must link to
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`
  (or `type=recovery`) instead of the default PKCE code link, which
  only works in the browser that requested it. `supabase/templates/`
  holds the local-dev versions of these templates as a reference —
  copy their content into the dashboard's Email Templates for
  Confirm signup, Reset password, and switch on the "password changed"
  notification template.
- **Redirect URL allow-list** (Authentication > URL Configuration): add
  the production URL and every Vercel preview URL.
- **`supabase db advisors`**: run against the live project once the
  migrations are applied there; it needs the project's own connection,
  not a local database. The migrations in this repo were written to
  satisfy every advisor this brief calls out (0001 unindexed foreign
  keys, 0011 unpinned `search_path`, 0028 privileged functions callable
  by anon) — this is a final confirmation, not expected to find
  anything new.
