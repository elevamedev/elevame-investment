#!/usr/bin/env node
/**
 * Register a kit's report in Supabase WITHOUT creating a login — for
 * the self-serve flow where the client signs up on their own and
 * then links their account using this kit's code + email (see
 * src/views/ClaimKitView.jsx). Pairs with `npm run seed`, which is
 * for the opposite case: staff creating a ready-to-use account
 * directly, no claim step needed.
 *
 * Two ways to use it:
 *
 *   Single kit via flags:
 *     node scripts/registerKit.mjs --kit ELVXXXXXXX --email client@example.com --name "Client Name" [--lang en|es] [--start-date YYYY-MM-DD]
 *
 *   Bulk via CSV (one row per kit — see scripts/kits.example.csv for
 *   the column layout, including per-score value/avg overrides):
 *     node scripts/registerKit.mjs --csv kits.csv
 *
 * Safe to re-run — upserts by kit code rather than duplicating.
 * Requires SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_URL in .env.
 */
import "dotenv/config";
import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

import {
  MICROBIOME_AGE_DEFAULT,
  DIVERSITY_DEFAULT,
  GUT_SCORES_DEFAULT,
  KEY_BACTERIA_DEFAULT,
} from "../src/data/gutScoresTemplate.js";
import { upsertFoodsCatalog, seedGutScores, seedPlan } from "./lib/provision.mjs";

const SCORE_KEYS = [...GUT_SCORES_DEFAULT, ...KEY_BACTERIA_DEFAULT].map(s => s.key);

const { values: args } = parseArgs({
  options: {
    csv: { type: "string" },
    kit: { type: "string" },
    email: { type: "string" },
    name: { type: "string" },
    lang: { type: "string", default: "en" },
    "start-date": { type: "string" },
  },
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment (.env).");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function rowFromCsvRecord(record) {
  const overrides = {};
  for (const key of SCORE_KEYS) {
    const v = record[`${key}_value`];
    const a = record[`${key}_avg`];
    if (v !== undefined && v !== "") {
      overrides[key] = {
        value: Number(v),
        avg: a !== undefined && a !== "" ? Number(a) : undefined,
      };
    }
  }
  return {
    kit: record.kit_code,
    email: record.expected_email,
    name: record.full_name,
    lang: record.language || "en",
    startDate: record.plan_start_date || new Date().toISOString().slice(0, 10),
    microbiomeAge: record.microbiome_age ? Number(record.microbiome_age) : MICROBIOME_AGE_DEFAULT,
    diversityValue: record.diversity_value ? Number(record.diversity_value) : DIVERSITY_DEFAULT.value,
    overrides,
  };
}

function loadRowsFromCsv(path) {
  const text = readFileSync(path, "utf8");
  const records = parse(text, { columns: true, skip_empty_lines: true, trim: true });
  return records.map(rowFromCsvRecord);
}

async function registerKit(row) {
  if (!row.kit || !row.email || !row.name) {
    throw new Error(`kit_code, expected_email and full_name are all required (got kit=${row.kit}, email=${row.email}, name=${row.name})`);
  }
  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert(
      {
        kit_code: row.kit,
        expected_email: row.email,
        full_name: row.name,
        language: row.lang,
        plan_start_date: row.startDate,
        microbiome_age: row.microbiomeAge,
        diversity_value: row.diversityValue,
        diversity_max: DIVERSITY_DEFAULT.max,
        // user_id / claimed_at stay NULL — the client links this
        // profile to their own account later via the app's
        // "claim your kit" screen.
      },
      { onConflict: "kit_code" }
    )
    .select()
    .single();
  if (error) throw error;

  const scoreCount = await seedGutScores(supabase, profile.id, row.overrides);
  const phaseCount = await seedPlan(supabase, profile.id);

  console.log(`✓ ${row.name} — kit ${row.kit} (${scoreCount} scores, ${phaseCount} plan phases, unclaimed)`);
  return profile;
}

async function main() {
  const foodCount = await upsertFoodsCatalog(supabase);
  console.log(`Upserted ${foodCount} foods into the shared catalog.\n`);

  let rows;
  if (args.csv) {
    rows = loadRowsFromCsv(args.csv);
  } else if (args.kit && args.email && args.name) {
    rows = [{
      kit: args.kit, email: args.email, name: args.name, lang: args.lang,
      startDate: args["start-date"] || new Date().toISOString().slice(0, 10),
      microbiomeAge: MICROBIOME_AGE_DEFAULT, diversityValue: DIVERSITY_DEFAULT.value,
      overrides: {},
    }];
  } else {
    console.error(
      "Usage:\n" +
      "  Single kit:  node scripts/registerKit.mjs --kit ELVXXXXXXX --email client@example.com --name \"Client Name\" [--lang en|es] [--start-date YYYY-MM-DD]\n" +
      "  Bulk (CSV):  node scripts/registerKit.mjs --csv kits.csv"
    );
    process.exit(1);
  }

  let ok = 0, failed = 0;
  for (const row of rows) {
    try {
      await registerKit(row);
      ok++;
    } catch (err) {
      failed++;
      console.error(`✗ ${row.name || row.kit || "(unknown)"}: ${err.message || err}`);
    }
  }

  console.log(`\nDone. ${ok} kit(s) registered, ${failed} failed.`);
  console.log("Clients can now sign up in the app and link their kit code + email to claim their report.");
}

main().catch(err => {
  console.error("Register-kit failed:", err.message || err);
  process.exit(1);
});
