#!/usr/bin/env bash
# Rebuilds the database from scratch (migrations run twice, to prove
# they're idempotent) and runs the structural RLS checks that need no
# client data. Run as the postgres user on Postgres 16.
#
# This does NOT run the full 158-check acceptance suite from the brief
# (outputs/cycle-14/supabase/acceptance_tests_cycle14.sql) — those
# checks assert against one real client's seeded report, which lives
# only in the private elevame-redesign repo and must never be copied
# here. Run that suite from elevame-redesign (scripts/test_cycle14.sh
# with APP=/path/to/elevame-investment) when validating against real
# report data.
set -uo pipefail
R="$(cd "$(dirname "$0")/.." && pwd)"
P="psql -U ${PGUSER:-postgres} -v ON_ERROR_STOP=1 -q -t"
LOG="$(mktemp)"

$P -c "drop database if exists elevame_db_test" -c "create database elevame_db_test" >"$LOG" 2>&1

run() {
  echo "== $1" >>"$LOG"
  $P -d elevame_db_test -f "$1" >>"$LOG" 2>&1 || echo "STOPPED in $1" >>"$LOG"
}

# A local auth schema stub (auth.users, auth.uid(), roles
# authenticated/anon) — real Supabase provides this; plain psql doesn't.
run "${AUTH_STUB:-$R/supabase/tests/local_auth_stub.sql}"

for f in "$R"/supabase/migrations/*.sql; do run "$f"; run "$f"; done   # twice: idempotent
run "$R/supabase/seed.sql"; run "$R/supabase/seed.sql"                 # twice: idempotent
run "$R/supabase/tests/rls_hygiene.sql"

sed "s/^psql:[^ ]* NOTICE:  /   /" "$LOG" | grep -v "skipping\|^ *$"
OK=$(grep -c "NOTICE:  ok  \|^ *ok  " "$LOG"); BAD=$(grep -c "STOPPED\|ERROR\|FAIL:" "$LOG")
echo "== $OK checks passed, $BAD errors"
rm -f "$LOG"
[ "$BAD" -eq 0 ]
