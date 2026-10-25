#!/usr/bin/env node
/**
 * Seeds only the static v2 catalogue (themes, metrics, screen panels,
 * food categories, conditions) — the same rows for every environment,
 * independent of any client's report. Run this once per environment
 * (local, staging, production) before registering any real client,
 * so the catalogue exists for the per-report seed scripts
 * (seedReportV2.mjs, registerKitFromV2.mjs) to attach to.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL in .env.
 * Safe to re-run — every write is an upsert.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { seedThemes, seedMetrics, seedScreenPanels, seedFoodCategories, seedConditions } from "./lib/catalogV2.mjs";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment (.env).");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  console.log(`Themes: ${await seedThemes(supabase)}`);
  console.log(`Metrics: ${await seedMetrics(supabase)}`);
  console.log(`Screen panels: ${await seedScreenPanels(supabase)}`);
  console.log(`Food categories: ${await seedFoodCategories(supabase)}`);
  console.log(`Conditions: ${await seedConditions(supabase)}`);
  console.log("\nCatalogue seeded.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
