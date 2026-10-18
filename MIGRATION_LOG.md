# Data model v1 → v2 migration log

## Rollback point

Before starting the v2 rearchitecture (themes/metrics/taxa/conditions/clients/kits/tests
per `DATA_MODEL_SPEC.md`), the app and schema were at:

- `main`: `56ffc8a511b83a72984df13725f4920bf47ff82a`
- `explore/app-improvements`: `bd3e0c4cbc4679b585fb5ab868682aafc122199d`

(Pushing an annotated git tag for this was rejected by the repo's push policy (403), so
the commit SHAs above are the rollback reference instead — `git checkout
56ffc8a511b83a72984df13725f4920bf47ff82a` restores the old app/schema exactly.)

## v1 schema snapshot (what existed before this migration)

One flat `profiles` table was the center of everything — a client's auth account,
their kit code, and their one report lived in a single row (see `supabase/schema.sql`
history at the commit above for the exact DDL). No support for retests, no catalogue/
per-test split.

Tables: `profiles`, `foods` (flat catalog with a single global `score` per food),
`gut_scores` (flat, category `gut_score`/`key_bacteria`), `screening_findings` (flat,
5-category safety panel), `similar_profiles` (flat), `plan_phases` → `plan_days` →
`plan_meals` (6-week diet plan), `shopping_checks`, `tracker_entries`, `milestones`.
Every child table FK'd to `profiles.id`. RLS: single `owns_profile(profile_id)` check,
one role (the client themselves) — no clinician/admin tier.

See `DATA_MODEL_SPEC.md` §"What already exists" (comparison posted to the user before
this migration) for the full table-by-table mapping from v1 → v2.

## v2 migration

See `supabase/schema.sql` (now containing both generations, v2 additive) and the
"Instructions for Claude Code" section of `DATA_MODEL_SPEC.md` for what v2 adds:
catalogue tables (themes, metrics, taxa, conditions, ...), client/kit/test separation
supporting retests, per-test result tables, and the Elevame review/insight/publish layer.
