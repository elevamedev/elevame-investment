#!/usr/bin/env node
/**
 * Create a client account staff manage end-to-end: a Supabase Auth
 * login AND a profile already linked to it (claimed_at set
 * immediately), with the default gut scores + 6-week plan. Use this
 * when you're setting a client up directly rather than having them
 * self-register — for the self-serve flow (client signs up, then
 * links their own kit code), use scripts/registerKit.mjs instead.
 *
 * Safe to re-run for the same email — it upserts the profile (keyed
 * by kit code) and replaces the plan/gut-score rows rather than
 * duplicating them.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (never expose this to the
 * browser) and VITE_SUPABASE_URL in your .env file.
 *
 * Usage:
 *   node scripts/seed.mjs --email pascale@example.com --name "Pascale Debain" --kit ELVMHB4178
 *   node scripts/seed.mjs --email pascale@example.com --name "Pascale Debain" --kit ELVMHB4178 --password "Sup3rSecret!" --lang es
 *
 * If --password is omitted, a random one is generated and printed
 * once at the end — hand it to the client (or have them reset it).
 */
import "dotenv/config";
import { parseArgs } from "node:util";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

import {
  MICROBIOME_AGE_DEFAULT,
  DIVERSITY_DEFAULT,
  WELLNESS_INDEX_DEFAULT,
  FB_RATIO_DEFAULT,
} from "../src/data/gutScoresTemplate.js";
import { upsertFoodsCatalog, seedGutScores, seedScreeningFindings, seedSimilarProfiles, seedPlan } from "./lib/provision.mjs";

const { values: args } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    kit: { type: "string" },
    password: { type: "string" },
    lang: { type: "string", default: "en" },
    "start-date": { type: "string" },
  },
});

if (!args.email || !args.name || !args.kit) {
  console.error("Usage: node scripts/seed.mjs --email you@example.com --name \"Client Name\" --kit KITCODE [--password ...] [--lang en|es] [--start-date YYYY-MM-DD]");
  process.exit(1);
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment (.env).");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function randomPassword() {
  return randomBytes(12).toString("base64url");
}

async function findUserByEmail(email) {
  const target = email.toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find(u => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < 200) break;
  }
  return null;
}

async function getOrCreateUser(email, password) {
  const existing = await findUserByEmail(email);
  if (existing) {
    console.log(`Found existing auth user for ${email} (${existing.id}) — leaving their password unchanged.`);
    return { user: existing, generatedPassword: null };
  }
  const generatedPassword = password || randomPassword();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: generatedPassword,
    email_confirm: true,
  });
  if (error) throw error;
  return { user: data.user, generatedPassword: password ? null : generatedPassword };
}

async function upsertProfile(userId, { email, name, kit, lang, startDate }) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        kit_code: kit,
        expected_email: email,
        full_name: name,
        language: lang,
        plan_start_date: startDate,
        microbiome_age: MICROBIOME_AGE_DEFAULT,
        diversity_value: DIVERSITY_DEFAULT.value,
        diversity_max: DIVERSITY_DEFAULT.max,
        wellness_index: WELLNESS_INDEX_DEFAULT,
        f_b_ratio: FB_RATIO_DEFAULT,
        claimed_at: new Date().toISOString(),
      },
      { onConflict: "kit_code" }
    )
    .select()
    .single();
  if (error) throw error;
  console.log(`Profile saved for ${name} (kit ${kit}).`);
  return data;
}

async function main() {
  const startDate = args["start-date"] || new Date().toISOString().slice(0, 10);

  const foodCount = await upsertFoodsCatalog(supabase);
  console.log(`Upserted ${foodCount} foods into the shared catalog.`);

  const { user, generatedPassword } = await getOrCreateUser(args.email, args.password);
  const profile = await upsertProfile(user.id, {
    email: args.email, name: args.name, kit: args.kit, lang: args.lang, startDate,
  });

  const scoreCount = await seedGutScores(supabase, profile.id);
  console.log(`Seeded ${scoreCount} gut score rows.`);
  const screeningCount = await seedScreeningFindings(supabase, profile.id);
  console.log(`Seeded ${screeningCount} screening finding rows.`);
  const similarProfilesCount = await seedSimilarProfiles(supabase, profile.id);
  console.log(`Seeded ${similarProfilesCount} similar-profile pattern rows.`);
  const phaseCount = await seedPlan(supabase, profile.id);
  console.log(`Seeded ${phaseCount} phases of the default 6-week plan.`);

  console.log("\nDone.");
  console.log(`  Client:   ${args.name} <${args.email}>`);
  console.log(`  Kit:      ${args.kit}`);
  console.log(`  User id:  ${user.id}`);
  if (generatedPassword) {
    console.log(`  Password: ${generatedPassword}  (share this with the client securely — it will not be shown again)`);
  }
}

main().catch(err => {
  console.error("Seed failed:", err.message || err);
  process.exit(1);
});
