#!/usr/bin/env node
/**
 * Seed a client into Supabase: creates their login (Supabase Auth),
 * their profile row, and assigns them the default 6-week plan +
 * default gut scores from src/data. Safe to re-run for the same
 * email — it upserts the profile/foods/gut-scores and replaces the
 * plan rows rather than duplicating them.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (never expose this to the
 * browser) and VITE_SUPABASE_URL in your .env file.
 *
 * Usage:
 *   node scripts/seed.mjs --email pascale@example.com --name "Pascale Debain" --kit ELVMHB4178
 *   node scripts/seed.mjs --email pascale@example.com --name "Pascale Debain" --password "Sup3rSecret!" --lang es
 *
 * If --password is omitted, a random one is generated and printed
 * once at the end — hand it to the client (or have them reset it).
 */
import "dotenv/config";
import { parseArgs } from "node:util";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

import { FOODS } from "../src/data/foods.js";
import { PHASES } from "../src/data/planTemplate.js";
import {
  GUT_SCORES_DEFAULT,
  KEY_BACTERIA_DEFAULT,
  MICROBIOME_AGE_DEFAULT,
  DIVERSITY_DEFAULT,
} from "../src/data/gutScoresTemplate.js";

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

if (!args.email || !args.name) {
  console.error("Usage: node scripts/seed.mjs --email you@example.com --name \"Client Name\" [--kit KITCODE] [--password ...] [--lang en|es] [--start-date YYYY-MM-DD]");
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

async function upsertFoodsCatalog() {
  const rows = Object.entries(FOODS).map(([id, f]) => ({
    id, category: f.cat, score: f.score, name_en: f.en, name_es: f.es,
  }));
  const { error } = await supabase.from("foods").upsert(rows);
  if (error) throw error;
  console.log(`Upserted ${rows.length} foods into the shared catalog.`);
}

async function upsertProfile(userId, { name, kit, lang, startDate }) {
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    full_name: name,
    kit_code: kit || null,
    language: lang,
    plan_start_date: startDate,
    microbiome_age: MICROBIOME_AGE_DEFAULT,
    diversity_value: DIVERSITY_DEFAULT.value,
    diversity_max: DIVERSITY_DEFAULT.max,
  });
  if (error) throw error;
  console.log(`Profile saved for ${name}.`);
}

async function seedGutScores(userId) {
  await supabase.from("gut_scores").delete().eq("profile_id", userId);
  const rows = [
    ...GUT_SCORES_DEFAULT.map((s, i) => ({ ...s, category: "gut_score", sortOrder: i })),
    ...KEY_BACTERIA_DEFAULT.map((s, i) => ({ ...s, category: "key_bacteria", sortOrder: i })),
  ].map(s => ({
    profile_id: userId,
    category: s.category,
    key: s.key,
    label_en: s.label.en,
    label_es: s.label.es,
    value: s.value,
    avg: s.avg,
    tag: s.tag,
    note_en: s.note.en,
    note_es: s.note.es,
    sort_order: s.sortOrder,
  }));
  const { error } = await supabase.from("gut_scores").insert(rows);
  if (error) throw error;
  console.log(`Seeded ${rows.length} gut score rows.`);
}

async function seedPlan(userId) {
  // Deleting plan_phases cascades to plan_days and plan_meals.
  await supabase.from("plan_phases").delete().eq("profile_id", userId);

  for (let i = 0; i < PHASES.length; i++) {
    const phase = PHASES[i];
    const { data: phaseRow, error: phaseErr } = await supabase
      .from("plan_phases")
      .insert({
        profile_id: userId,
        phase_index: i,
        phase_key: phase.id,
        weeks_en: phase.weeks.en,
        weeks_es: phase.weeks.es,
        subtitle_en: phase.subtitle.en,
        subtitle_es: phase.subtitle.es,
        blurb_en: phase.blurb.en,
        blurb_es: phase.blurb.es,
        start_day: i * 14 + 1,
      })
      .select()
      .single();
    if (phaseErr) throw phaseErr;

    for (let j = 0; j < phase.days.length; j++) {
      const day = phase.days[j];
      const { data: dayRow, error: dayErr } = await supabase
        .from("plan_days")
        .insert({
          phase_id: phaseRow.id,
          day_index: j,
          tip_en: day.tip?.en ?? null,
          tip_es: day.tip?.es ?? null,
        })
        .select()
        .single();
      if (dayErr) throw dayErr;

      const mealRows = day.meals.map((m, k) => ({
        day_id: dayRow.id,
        meal_order: k,
        label_key: m.labelKey,
        dish_en: m.dish.en,
        dish_es: m.dish.es,
        desc_en: m.desc?.en ?? null,
        desc_es: m.desc?.es ?? null,
        foods: m.foods,
      }));
      const { error: mealErr } = await supabase.from("plan_meals").insert(mealRows);
      if (mealErr) throw mealErr;
    }
  }
  console.log(`Seeded ${PHASES.length} phases of the default 6-week plan.`);
}

async function main() {
  const startDate = args["start-date"] || new Date().toISOString().slice(0, 10);

  await upsertFoodsCatalog();

  const { user, generatedPassword } = await getOrCreateUser(args.email, args.password);
  await upsertProfile(user.id, { name: args.name, kit: args.kit, lang: args.lang, startDate });
  await seedGutScores(user.id);
  await seedPlan(user.id);

  console.log("\nDone.");
  console.log(`  Client:   ${args.name} <${args.email}>`);
  console.log(`  User id:  ${user.id}`);
  if (generatedPassword) {
    console.log(`  Password: ${generatedPassword}  (share this with the client securely — it will not be shown again)`);
  }
}

main().catch(err => {
  console.error("Seed failed:", err.message || err);
  process.exit(1);
});
