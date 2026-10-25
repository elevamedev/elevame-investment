#!/usr/bin/env node
/**
 * Companion to scripts/seedReportV2.mjs — projects the same real
 * report (kit ELVMWB6271 / El Hachemi) down into the v1 tables
 * (profiles/gut_scores/screening_findings/similar_profiles/plan_*)
 * so the client is immediately visible in the CURRENT app UI, which
 * still reads v1 exclusively. Reads the same extraction JSON as
 * seedReportV2.mjs, from ELEVAME_CLIENT_DATA_DIR/elvmwb6271/ (never
 * committed to this repo — see .gitignore) — run that script first
 * so the v2 tables are populated too.
 *
 * Two modes:
 *   - No --password: self-serve-claimable profile (registerKit.mjs
 *     style) — user_id stays NULL, the client signs up themselves
 *     and claims the kit with --email + their own chosen password.
 *   - With --password: creates (or reuses) a Supabase Auth account
 *     for --email directly and links it immediately (seed.mjs
 *     style, claimed_at set now) — hand the email/password straight
 *     to the client, no claim step needed. Also syncs the matching
 *     v2 `clients.auth_user_id` (see supabase/schema_v2_admin.sql)
 *     so the v2-powered screens (Report tab, Supplements, ...)
 *     resolve for them too, not just the v1 ones.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL in .env.
 * Safe to re-run — every write is an upsert/delete+insert.
 */
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { upsertFoodsCatalog } from "./lib/provision.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Never committed to this repo — same note as in seedReportV2.mjs.
const SCRATCH =
  process.env.SCRATCH ||
  (process.env.ELEVAME_CLIENT_DATA_DIR && join(process.env.ELEVAME_CLIENT_DATA_DIR, "elvmwb6271")) ||
  join(__dirname, "data/elvmwb6271");
if (!existsSync(SCRATCH)) {
  console.error(
    `Client data directory not found: ${SCRATCH}\n` +
      "Set ELEVAME_CLIENT_DATA_DIR to a local copy of the extracted report JSON. " +
      "This data must never be committed to elevame-investment."
  );
  process.exit(1);
}
const KIT_CODE = "ELVMWB6271";
const CLIENT_NAME = "El Hachemi Abdelhak";

const { values: args } = parseArgs({ options: { email: { type: "string" }, password: { type: "string" } } });
const EXPECTED_EMAIL = args.email || `pending-email+${KIT_CODE.toLowerCase()}@elevame.es`;

async function findUserByEmail(supabase, email) {
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

async function getOrCreateAuthUser(supabase, email, password) {
  const existing = await findUserByEmail(supabase, email);
  if (existing) {
    console.log(`Found existing auth user for ${email} (${existing.id}) — leaving their password unchanged.`);
    return existing;
  }
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return data.user;
}

function readJSON(name) {
  const path = `${SCRATCH}/${name}`;
  if (!existsSync(path)) throw new Error(`Missing ${path}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment (.env).");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const BADGE_TO_TAG = { good: "strength", watch: "onTrack", act: "focus" };
const GUT_SCORE_KEY_MAP = {
  metabolic_score: "metabolic", carbohydrate_metabolism: "carb", protein_metabolism: "protein", fat_metabolism: "fat",
  vitamin_synthesis: "vitamin", lactose_sensitivity: "lactose", gluten_sensitivity: "gluten", sugar_index: "sugar",
  processed_food_index: "processed", bowel_mobility: "bowel", antibiotic_damage: "antibiotic",
  autoimmune_index: "autoimmune", sleep_quality: "sleep",
};
const GUT_SCORE_LABELS = {
  metabolic: ["Metabolic Score", "Score Metabólico"], carb: ["Carbohydrate Metabolism", "Metabolismo de Carbohidratos"],
  protein: ["Protein Metabolism", "Metabolismo de Proteínas"], fat: ["Fat Metabolism", "Metabolismo de Grasas"],
  vitamin: ["Vitamin Synthesis", "Síntesis de Vitaminas"], lactose: ["Lactose Sensitivity", "Sensibilidad a la Lactosa"],
  gluten: ["Gluten Sensitivity", "Sensibilidad al Gluten"], sugar: ["Sugar Index", "Índice de Azúcar"],
  processed: ["Processed Food Index", "Índice de Alimentos Procesados"], bowel: ["Bowel Mobility", "Motilidad Intestinal"],
  antibiotic: ["Antibiotic Damage", "Daño por Antibióticos"], autoimmune: ["Autoimmune Index", "Índice Autoinmune"],
  sleep: ["Sleep Quality", "Calidad del Sueño"],
};
const DIRECTION_MAP = {
  metabolic: "lower_better", carb: "higher_better", protein: "higher_better", fat: "higher_better", vitamin: "higher_better",
  lactose: "lower_better", gluten: "lower_better", sugar: "lower_better", processed: "lower_better", bowel: "middle_best",
  antibiotic: "lower_better", autoimmune: "lower_better", sleep: "higher_better",
};
const KEY_BACTERIA_KEY_MAP = {
  Alistipes: "alistipes", Prevotella: "prevotella", Akkermansia: "akkermansia", Eubacterium: "eubacterium",
  Bifidobacterium: "bifido", Collinsella: "collinsella", Haemophilus: "haemophilus", Roseburia: "roseburia",
  Phascolarctobacterium: "phascolarctobacterium",
};
const KEY_BACTERIA_LABELS = {
  alistipes: "Alistipes", prevotella: "Prevotella", akkermansia: "Akkermansia", eubacterium: "Eubacterium",
  bifido: "Bifidobacterium", collinsella: "Collinsella", haemophilus: "Haemophilus", roseburia: "Roseburia",
  phascolarctobacterium: "Phascolarctobacterium",
};

const SIMILAR_PROFILE_LABELS_ES = {
  "Food Allergy": "Alergia Alimentaria",
  "Respiratory Disorders": "Trastornos Respiratorios",
  "Autoimmune Disorder(s)": "Trastorno(s) Autoinmune(s)",
  "Thyroid Related Disorder(s)": "Trastorno(s) Relacionado(s) con la Tiroides",
  "Symptoms Associated with Irritable Bowel Syndrome": "Síntomas Asociados al Síndrome del Intestino Irritable",
  "Heart Related Disorder(s)": "Trastorno(s) Relacionado(s) con el Corazón",
  "Attention Disorder(s)": "Trastorno(s) de Atención",
  "Small Intestinal Bacterial Overgrowth (SIBO)": "Sobrecrecimiento Bacteriano del Intestino Delgado (SIBO)",
};

function slugify(name) {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function noteFor(value, avg, direction) {
  if (avg == null || value == null) return [null, null];
  const diff = value - avg;
  const close = Math.abs(diff) <= Math.max(3, avg * 0.1);
  if (close) return [`${value} — right at the community average of ${avg}.`, `${value}: justo en la media de la comunidad de ${avg}.`];
  const better = direction === "middle_best" ? null : (direction === "higher_better") === diff > 0;
  if (better === null) return [`${value}, with the community average at ${avg}.`, `${value}, con la media de la comunidad en ${avg}.`];
  return better
    ? [`${value} vs a community average of ${avg} — a strength in this profile.`, `${value} frente a una media de la comunidad de ${avg}: un punto fuerte de este perfil.`]
    : [`${value} vs a community average of ${avg} — an area this plan focuses on.`, `${value} frente a una media de la comunidad de ${avg}: un área en la que se enfoca este plan.`];
}

async function main() {
  const doctor = readJSON("doctor_report_extracted.json");
  const dietPlanPath = existsSync(`${SCRATCH}/diet_plan_extracted_es.json`) ? "diet_plan_extracted_es.json" : "diet_plan_extracted.json";
  const dietPlan = readJSON(dietPlanPath);
  if (dietPlanPath === "diet_plan_extracted.json") console.warn("⚠ diet_plan_extracted_es.json not found yet — plan will be seeded with Spanish fields falling back to English. Re-run once the translation lands.");

  console.log(`Registering v1 profile for kit ${KIT_CODE} (${EXPECTED_EMAIL})...\n`);
  if (!args.email) console.warn(`⚠ No real client email found in the source PDFs — using placeholder "${EXPECTED_EMAIL}". The client CANNOT claim their kit until you set the real email (Supabase table editor, or re-run with --email).\n`);

  const foodCount = await upsertFoodsCatalog(supabase);
  console.log(`Upserted ${foodCount} foods into the legacy shopping-list catalog.`);

  let authUser = null;
  if (args.password) {
    authUser = await getOrCreateAuthUser(supabase, EXPECTED_EMAIL, args.password);
    console.log(`Auth user: ${authUser.id} <${EXPECTED_EMAIL}>`);
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles").upsert({
      kit_code: KIT_CODE, expected_email: EXPECTED_EMAIL, full_name: CLIENT_NAME, language: "en",
      plan_start_date: doctor.report_meta.report_date, microbiome_age: doctor.headline_metrics.find(m => m.metric_id === "microbiome_age")?.value,
      diversity_value: doctor.headline_metrics.find(m => m.metric_id === "diversity")?.value,
      diversity_max: doctor.headline_metrics.find(m => m.metric_id === "diversity")?.scale_max || 10,
      wellness_index: (doctor.headline_metrics.find(m => m.metric_id === "wellness_index")?.value_text || "").toLowerCase().startsWith("good") ? "good" : "fair",
      f_b_ratio: doctor.headline_metrics.find(m => m.metric_id === "fb_ratio")?.value,
      ...(authUser ? { user_id: authUser.id, claimed_at: new Date().toISOString() } : {}),
    }, { onConflict: "kit_code" }).select().single();
  if (profileErr) throw profileErr;
  const profileId = profile.id;
  console.log(`Profile: ${profileId}`);

  if (authUser) {
    // Go through kit_code -> kits -> clients, not legacy_profile_id:
    // seedReportV2.mjs creates its own `clients` row for a brand new
    // kit without setting legacy_profile_id (it has no v1 profile to
    // link to yet at that point), so matching on legacy_profile_id
    // here would silently update zero rows. kit_code is the one link
    // both scripts actually share.
    const { data: kit, error: kitErr } = await supabase.from("kits").select("client_id").eq("kit_code", KIT_CODE).maybeSingle();
    if (kitErr) throw kitErr;
    if (!kit) {
      console.warn(`⚠ No v2 kit row found for ${KIT_CODE} — did you run seedReportV2.mjs first? The v2-powered screens (Report tab, Supplements) won't resolve for this client until you do.`);
    } else {
      const { data: updated, error: clientSyncErr } = await supabase
        .from("clients").update({ auth_user_id: authUser.id }).eq("id", kit.client_id).select();
      if (clientSyncErr) throw clientSyncErr;
      if (!updated?.length) console.warn(`⚠ clients row ${kit.client_id} (for kit ${KIT_CODE}) wasn't updated — check it still exists.`);
      else console.log(`Synced v2 clients.auth_user_id for client ${kit.client_id} -> ${authUser.id}`);
    }
  }

  // ---- gut_scores (13 panel scores + 9 key bacteria) ----
  await supabase.from("gut_scores").delete().eq("profile_id", profileId);
  const gutScoreRows = doctor.gut_scores.map((g, i) => {
    const key = GUT_SCORE_KEY_MAP[g.metric_id];
    const [label_en, label_es] = GUT_SCORE_LABELS[key];
    const [note_en, note_es] = noteFor(g.value, g.community_value, DIRECTION_MAP[key]);
    return {
      profile_id: profileId, category: "gut_score", key, label_en, label_es,
      value: g.value, avg: g.community_value, tag: BADGE_TO_TAG[g.printed_badge] || "onTrack",
      note_en: g.printed_comment || note_en, note_es: g.printed_comment ? null : note_es, sort_order: i,
    };
  });
  const keyBacteriaRows = doctor.key_bacteria.map((k, i) => {
    const key = KEY_BACTERIA_KEY_MAP[k.taxon];
    const gap = k.client_score - k.community_score;
    const tag = Math.abs(gap) < 20 ? "onTrack" : gap > 0 ? "strength" : "focus";
    const [note_en, note_es] = noteFor(k.client_score, k.community_score, "higher_better");
    return {
      profile_id: profileId, category: "key_bacteria", key, label_en: KEY_BACTERIA_LABELS[key], label_es: KEY_BACTERIA_LABELS[key],
      value: k.client_score, avg: k.community_score, tag, note_en, note_es, sort_order: i,
    };
  });
  const { error: gsErr } = await supabase.from("gut_scores").insert([...gutScoreRows, ...keyBacteriaRows]);
  if (gsErr) throw gsErr;
  console.log(`Gut scores: ${gutScoreRows.length}, key bacteria: ${keyBacteriaRows.length}`);

  // ---- screening_findings ----
  const PANEL_MAP = { pathogenic_bacteria: "pathogenic_bacteria", parasites: "parasites", fungi_yeast: "fungi", dysbiotic_overgrowth_bacteria: "dysbiotic_bacteria", potential_autoimmune_triggers: "autoimmune_triggers" };
  await supabase.from("screening_findings").delete().eq("profile_id", profileId);
  const screeningRows = [];
  let sortOrder = 0;
  const seenKeys = new Set();
  Object.entries(doctor.safety_screen).forEach(([panelKey, panel]) => {
    panel.items.forEach(it => {
      const dedupeKey = `${panelKey}:${slugify(it.organism)}`;
      if (seenKeys.has(dedupeKey)) return; // drop the known duplicate Campylobacter coli row
      seenKeys.add(dedupeKey);
      screeningRows.push({
        profile_id: profileId, category: PANEL_MAP[panelKey], key: slugify(it.organism),
        name_en: it.organism, name_es: it.organism, status: it.status, abundance_pct: it.abundance_pct,
        note_en: null, note_es: null, sort_order: sortOrder++,
      });
    });
  });
  const { error: sfErr } = await supabase.from("screening_findings").insert(screeningRows);
  if (sfErr) throw sfErr;
  console.log(`Screening findings: ${screeningRows.length}`);

  // ---- similar_profiles ----
  await supabase.from("similar_profiles").delete().eq("profile_id", profileId);
  const similarRows = doctor.similar_profiles.map((p, i) => ({
    profile_id: profileId, key: slugify(p.condition), label_en: p.condition, label_es: SIMILAR_PROFILE_LABELS_ES[p.condition] || p.condition,
    client_pct: p.client_pct, baseline_pct: p.overall_pct, sort_order: i,
  }));
  const { error: spErr } = await supabase.from("similar_profiles").insert(similarRows);
  if (spErr) throw spErr;
  console.log(`Similar profiles: ${similarRows.length}`);

  // ---- 6-week plan (bespoke, from the diet plan PDF — not the generic template) ----
  await supabase.from("plan_phases").delete().eq("profile_id", profileId);
  for (const phase of dietPlan.phases) {
    const { data: phaseRow, error: phaseErr } = await supabase.from("plan_phases").insert({
      profile_id: profileId, phase_index: phase.phase_index, phase_key: phase.phase_key,
      weeks_en: phase.weeks_en, weeks_es: phase.weeks_es || phase.weeks_en,
      subtitle_en: phase.subtitle_en, subtitle_es: phase.subtitle_es || phase.subtitle_en,
      blurb_en: phase.blurb_en, blurb_es: phase.blurb_es || phase.blurb_en,
      start_day: phase.phase_index * 14 + 1,
    }).select().single();
    if (phaseErr) throw phaseErr;

    for (const day of phase.days) {
      const { data: dayRow, error: dayErr } = await supabase.from("plan_days").insert({
        phase_id: phaseRow.id, day_index: day.day_index,
        tip_en: day.tip || null, tip_es: day.tip_es || day.tip || null,
      }).select().single();
      if (dayErr) throw dayErr;

      const meals = ["breakfast", "lunch", "dinner", "snack"].map((labelKey, k) => {
        const m = day[labelKey];
        // best-effort food id guesses from the dish text — purely
        // for the shopping-list feature; harmless if a guess misses.
        const foods = [];
        return {
          day_id: dayRow.id, meal_order: k, label_key: labelKey,
          dish_en: m.dish, dish_es: m.dish_es || m.dish,
          desc_en: m.desc || null, desc_es: m.desc_es || m.desc || null,
          foods,
        };
      });
      const { error: mealErr } = await supabase.from("plan_meals").insert(meals);
      if (mealErr) throw mealErr;
    }
  }
  console.log(`Plan: ${dietPlan.phases.length} phases seeded.`);

  console.log(`\nDone.`);
  console.log(`  Client:   ${CLIENT_NAME}`);
  console.log(`  Kit:      ${KIT_CODE}`);
  console.log(`  Email:    ${EXPECTED_EMAIL}${args.email ? "" : "  <-- PLACEHOLDER, update before the client tries to claim"}`);
  if (authUser) {
    console.log(`  Password: ${args.password}`);
    console.log(`\nReady to use — sign in at the login screen with the email and password above. No claim step needed.`);
  } else {
    console.log(`\nThe client can now sign up in the app and claim this kit with code ${KIT_CODE} + the email above.`);
  }
}

main().catch(err => {
  console.error("registerKitFromV2 failed:", err.message || err);
  process.exit(1);
});
