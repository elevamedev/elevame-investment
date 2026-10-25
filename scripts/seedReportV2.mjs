#!/usr/bin/env node
/**
 * Populate the v2 data model (DATA_MODEL_SPEC.md) for one real test:
 * kit ELVMWB6271 / El Hachemi, from the extracted PDF JSON in the
 * session scratchpad. This is a one-off ETL for this specific report
 * — a general "any kit, any PDF" parser (step 4 of the spec's
 * instructions) is future work, not what this script does.
 *
 * Reads (fixed paths — this script is for this one report only):
 *   doctor_report_extracted.json, user_report_extracted.json,
 *   diet_plan_extracted.json, food_names_es.json
 * from ELEVAME_CLIENT_DATA_DIR/elvmwb6271/ (or override the whole path
 * with SCRATCH). Real client data must never be committed to this repo
 * (see .gitignore and DECISIONS.md, 2026-10-19) — point
 * ELEVAME_CLIENT_DATA_DIR at a local, untracked copy instead.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL in .env.
 * Safe to re-run — every write is an upsert.
 */
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { slugify } from "./lib/slug.mjs";
import { seedThemes, seedMetrics, seedScreenPanels, seedFoodCategories, FOOD_CATEGORIES } from "./lib/catalogV2.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRATCH =
  process.env.SCRATCH ||
  (process.env.ELEVAME_CLIENT_DATA_DIR && join(process.env.ELEVAME_CLIENT_DATA_DIR, "elvmwb6271")) ||
  join(__dirname, "data/elvmwb6271");
if (!existsSync(SCRATCH)) {
  console.error(
    `Client data directory not found: ${SCRATCH}\n` +
      "Set ELEVAME_CLIENT_DATA_DIR to a local copy of the extracted report JSON " +
      "(doctor_report_extracted.json, user_report_extracted.json, diet_plan_extracted.json, " +
      "food_names_es.json, diet_plan_extracted_es.json under <dir>/elvmwb6271/). " +
      "This data must never be committed to elevame-investment."
  );
  process.exit(1);
}
const KIT_CODE = "ELVMWB6271";
const CLIENT_NAME = "El Hachemi Abdelhak";
const PLACEHOLDER_EMAIL = `pending-email+${KIT_CODE.toLowerCase()}@elevame.es`;

function readJSON(name) {
  const path = `${SCRATCH}/${name}`;
  if (!existsSync(path)) throw new Error(`Missing ${path} — run the extraction step first.`);
  return JSON.parse(readFileSync(path, "utf8"));
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment (.env).");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const PANEL_ID_MAP = {
  pathogenic_bacteria: "pathogens",
  parasites: "parasites",
  fungi_yeast: "fungi",
  dysbiotic_overgrowth_bacteria: "overgrowth",
  potential_autoimmune_triggers: "autoimmune_triggers",
};

const STATUS_MAP = { "Not Detected": "not_detected", Low: "low", Normal: "normal", High: "high" };

// The extractor sometimes wrote a page RANGE as a string (a section
// spanning two PDF pages, e.g. "30-31" for tma_conversion) instead of
// a single integer — every `page` column here is a plain int, so
// take the first number rather than letting the insert fail.
function joinNames(names, lang) {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  const last = names[names.length - 1];
  const rest = names.slice(0, -1).join(", ");
  return `${rest} ${lang === "es" ? "y" : "and"} ${last}`;
}

function toPageInt(value) {
  if (value == null) return null;
  if (typeof value === "number") return value;
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : null;
}

function taxonRank(name) {
  if (/aceae$/.test(name)) return "family";
  if (/ales$/.test(name)) return "order";
  if (["Firmicutes", "Bacteroidetes", "Actinobacteria", "Proteobacteria", "Verrucomicrobia"].includes(name)) return "phylum";
  if (/^[A-Z][a-z]+ [a-z]/.test(name)) return "species";
  return "genus";
}

const CONDITIONS = [
  { id: "diarrhea", theme_id: "digestion", kind: "symptom", name_en: "Diarrhea", name_es: "Diarrea" },
  { id: "gas", theme_id: "digestion", kind: "symptom", name_en: "Gas", name_es: "Gases" },
  { id: "constipation", theme_id: "digestion", kind: "symptom", name_en: "Constipation", name_es: "Estreñimiento" },
  { id: "bloating", theme_id: "digestion", kind: "symptom", name_en: "Bloating", name_es: "Hinchazón" },
  { id: "irritable_bowel_syndrome", theme_id: "digestion", kind: "symptom", name_en: "Irritable Bowel Syndrome (IBS)", name_es: "Síndrome del Intestino Irritable (SII)" },
  { id: "inflammatory_bowel_disease", theme_id: "inflammation", kind: "disease", name_en: "Inflammatory Bowel Disease (IBD)", name_es: "Enfermedad Inflamatoria Intestinal (EII)" },
  { id: "crohns_disease", theme_id: "inflammation", kind: "disease", name_en: "Crohn's Disease", name_es: "Enfermedad de Crohn" },
  { id: "ulcerative_colitis", theme_id: "inflammation", kind: "disease", name_en: "Ulcerative Colitis", name_es: "Colitis Ulcerosa" },
  { id: "obesity", theme_id: "metabolism", kind: "disease", name_en: "Obesity", name_es: "Obesidad" },
  { id: "type_2_diabetes", theme_id: "metabolism", kind: "disease", name_en: "Type 2 Diabetes", name_es: "Diabetes Tipo 2" },
  { id: "coronary_heart_disease", theme_id: "heart", kind: "disease", name_en: "Coronary Heart Disease", name_es: "Enfermedad Coronaria" },
  { id: "kidney_stone", theme_id: "heart", kind: "disease", name_en: "Kidney Stone", name_es: "Cálculos Renales" },
  { id: "butyric_acid_biosynthesis", theme_id: "inflammation", kind: "pathway", name_en: "Butyric Acid Biosynthesis", name_es: "Biosíntesis de Ácido Butírico" },
  { id: "tma_conversion", theme_id: "heart", kind: "pathway", name_en: "Trimethylamine (TMA) Conversion", name_es: "Conversión de Trimetilamina (TMA)" },
  { id: "polyamine_biosynthesis", theme_id: "inflammation", kind: "pathway", name_en: "Polyamine Biosynthesis", name_es: "Biosíntesis de Poliaminas" },
  { id: "propionate_biosynthesis", theme_id: "inflammation", kind: "pathway", name_en: "Propionate Biosynthesis", name_es: "Biosíntesis de Propionato" },
  { id: "serotonin_biosynthesis", theme_id: "mind", kind: "pathway", name_en: "Serotonin Biosynthesis", name_es: "Biosíntesis de Serotonina" },
  { id: "gaba_biosynthesis", theme_id: "mind", kind: "pathway", name_en: "GABA Biosynthesis", name_es: "Biosíntesis de GABA (Ácido Gamma-Aminobutírico)" },
  { id: "lactose_sensitivity_assoc", theme_id: "digestion", kind: "pathway", name_en: "Lactose Sensitivity (bacterial associations)", name_es: "Sensibilidad a la Lactosa (asociaciones bacterianas)" },
  { id: "gluten_sensitivity_assoc", theme_id: "digestion", kind: "pathway", name_en: "Gluten Sensitivity (bacterial associations)", name_es: "Sensibilidad al Gluten (asociaciones bacterianas)" },
];
// pathway_tables JSON key -> conditions.id (two keys collide with the
// metrics catalog's ids, so these two conditions use a distinct id).
const PATHWAY_KEY_TO_CONDITION = Object.fromEntries(CONDITIONS.map(c => [c.id.replace(/_assoc$/, ""), c.id]));

const SIMILAR_CONDITIONS_THEME = {
  "Food Allergy": "digestion",
  "Respiratory Disorders": "inflammation",
  "Autoimmune Disorder(s)": "inflammation",
  "Thyroid Related Disorder(s)": "overview",
  "Symptoms Associated with Irritable Bowel Syndrome": "digestion",
  "Heart Related Disorder(s)": "heart",
  "Attention Disorder(s)": "mind",
  "Small Intestinal Bacterial Overgrowth (SIBO)": "digestion",
};

const COMPOUND_GROUPS = [
  { id: "fermented", name_en: "Fermented Foods" },
  { id: "phytochemicals", name_en: "Phytochemicals" },
  { id: "carbohydrates", name_en: "Carbohydrates" },
  { id: "lipids", name_en: "Lipids" },
  { id: "proteins", name_en: "Proteins" },
];

async function main() {
  console.log(`Seeding v2 data model for kit ${KIT_CODE}...\n`);
  const doctor = readJSON("doctor_report_extracted.json");
  const user = readJSON("user_report_extracted.json");
  const dietPlan = readJSON("diet_plan_extracted.json");
  const esNames = existsSync(`${SCRATCH}/food_names_es.json`) ? readJSON("food_names_es.json") : null;
  if (!esNames) console.warn("⚠ food_names_es.json not found yet — foods will be seeded with name_es = name_en as a placeholder. Re-run this script once translations land.");

  // ---- 1. Static catalogue ----
  console.log(`Themes: ${await seedThemes(supabase)}`);
  console.log(`Metrics: ${await seedMetrics(supabase)}`);
  console.log(`Screen panels: ${await seedScreenPanels(supabase)}`);
  console.log(`Food categories: ${await seedFoodCategories(supabase)}`);

  // ---- 2. Taxa catalogue (derived from every section that names one) ----
  const taxaMap = new Map(); // id -> { id, name, rank, roles: Set, audience }
  function touchTaxon(name, { role, audience } = {}) {
    if (!name || name === "Microbiome Diversity" || name === "Bacteria") return null;
    const id = slugify(name);
    if (!taxaMap.has(id)) taxaMap.set(id, { id, name, rank: taxonRank(name), roles: new Set(), audience: audience || "clinician" });
    if (role) taxaMap.get(id).roles.add(role);
    return id;
  }
  // The extractor used two different shapes for pathway tables: most
  // have positively_associated/negatively_associated arrays, but the
  // pure-biosynthesis pathways (butyric acid, polyamine, propionate,
  // serotonin, GABA) plus lactose/gluten sensitivity use a flat `taxa`
  // array instead (association: null — Enbiosis doesn't frame these
  // as positive/negative). Normalize both into one row shape so
  // nothing from the `taxa`-shaped tables gets silently dropped.
  function pathwayRows(table) {
    if (table.positively_associated || table.negatively_associated) {
      return [...(table.positively_associated || []), ...(table.negatively_associated || [])];
    }
    return (table.taxa || []).map(r => ({ taxon: r.taxon, status: r.status, association: r.association, reference_ids: r.reference_ids || [] }));
  }

  doctor.genus_abundance.forEach(g => touchTaxon(g.genus, { audience: "both" }));
  doctor.key_bacteria.forEach(k => touchTaxon(k.taxon, { audience: "both" }));
  doctor.krona_abundance.forEach(k => touchTaxon(k.taxon));
  Object.entries(doctor.safety_screen).forEach(([panelKey, panel]) => {
    const role = panelKey === "parasites" ? "parasite" : panelKey === "fungi_yeast" ? "fungal" : "pathogen";
    panel.items.forEach(it => touchTaxon(it.organism, { role, audience: "both" }));
  });
  Object.entries(doctor.pathway_tables).forEach(([key, table]) => {
    const rows = pathwayRows(table);
    if (!rows.length) return;
    const role = key === "tma_conversion" ? "tma" : key === "butyric_acid_biosynthesis" ? "butyrate" : key === "propionate_biosynthesis" ? "propionate" : null;
    rows.forEach(r => touchTaxon(r.taxon, { role }));
  });

  const { error: taxaErr } = await supabase.from("taxa").upsert(
    [...taxaMap.values()].map(t => ({ id: t.id, name: t.name, rank: t.rank, roles: [...t.roles], audience: t.audience }))
  );
  if (taxaErr) throw taxaErr;
  console.log(`Taxa: ${taxaMap.size}`);

  // ---- 3. Conditions + condition_taxa catalogue ----
  const { error: condErr } = await supabase.from("conditions").upsert(CONDITIONS);
  if (condErr) throw condErr;
  const conditionTaxaRows = [];
  Object.entries(doctor.pathway_tables).forEach(([key, table]) => {
    const conditionId = PATHWAY_KEY_TO_CONDITION[key];
    if (!conditionId) return;
    pathwayRows(table).forEach(r => {
      const taxonId = touchTaxon(r.taxon);
      if (!taxonId) return;
      conditionTaxaRows.push({ condition_id: conditionId, taxon_id: taxonId, association: r.association, reference_ids: r.reference_ids || [] });
    });
  });
  const { error: ctErr } = await supabase.from("condition_taxa").upsert(conditionTaxaRows, { onConflict: "condition_id,taxon_id" });
  if (ctErr) throw ctErr;
  console.log(`Conditions: ${CONDITIONS.length}, condition_taxa: ${conditionTaxaRows.length}`);

  // ---- 4. Similar conditions catalogue ----
  const similarConditions = doctor.similar_profiles.map(p => ({
    id: slugify(p.condition),
    theme_id: SIMILAR_CONDITIONS_THEME[p.condition] || "overview",
    name_en: p.condition,
    name_es: p.condition,
  }));
  const { error: scErr } = await supabase.from("similar_conditions").upsert(similarConditions);
  if (scErr) throw scErr;
  console.log(`Similar conditions: ${similarConditions.length}`);

  // ---- 5. Screen items catalogue ----
  const screenItemRows = [];
  Object.entries(doctor.safety_screen).forEach(([panelKey, panel]) => {
    const panelId = PANEL_ID_MAP[panelKey];
    const seen = new Set();
    panel.items.forEach(it => {
      const taxonId = touchTaxon(it.organism);
      if (!taxonId || seen.has(taxonId)) return; // de-dupe the known Campylobacter coli double row
      seen.add(taxonId);
      screenItemRows.push({ panel_id: panelId, taxon_id: taxonId });
    });
  });
  const { error: siErr } = await supabase.from("screen_items").upsert(screenItemRows, { onConflict: "panel_id,taxon_id" });
  if (siErr) throw siErr;
  console.log(`Screen items: ${screenItemRows.length}`);

  // ---- 6. Compound groups + compounds catalogue ----
  const { error: cgErr } = await supabase.from("compound_groups").upsert(COMPOUND_GROUPS);
  if (cgErr) throw cgErr;
  const compoundRows = [];
  const compoundScoreRowsByGroup = {};
  Object.entries(doctor.compound_scores).forEach(([groupId, section]) => {
    if (!section || !Array.isArray(section.compound_scores)) return;
    compoundScoreRowsByGroup[groupId] = section.compound_scores.map(c => {
      const id = `${groupId}_${slugify(c.compound)}`;
      compoundRows.push({ id, group_id: groupId, name: c.compound });
      return { id, score: c.score };
    });
  });
  const { error: cErr } = await supabase.from("compounds").upsert(compoundRows);
  if (cErr) throw cErr;
  console.log(`Compounds: ${compoundRows.length}`);

  // ---- 7. Supplements catalogue ----
  const supplementRows = [];
  const supplementScoreRows = [];
  ["prebiotics", "probiotics"].forEach(typeKey => {
    const type = typeKey === "prebiotics" ? "prebiotic" : "probiotic";
    (doctor.supplements[typeKey]?.items || []).forEach(s => {
      const id = `${type}_${slugify(s.brand + "_" + s.product)}`;
      supplementRows.push({ id, type, product: s.product, brand: s.brand });
      supplementScoreRows.push({ id, score: s.score });
    });
  });
  const { error: supErr } = await supabase.from("supplements").upsert(supplementRows);
  if (supErr) throw supErr;
  console.log(`Supplements: ${supplementRows.length}`);

  // ---- 8. References catalogue ----
  const { error: refErr } = await supabase.from("references_lit").upsert(
    doctor.references_lit.items.map(r => ({ id: r.number, citation: r.citation, doi_url: r.doi_url }))
  );
  if (refErr) throw refErr;
  console.log(`References: ${doctor.references_lit.items.length}`);

  // ---- 9. Foods catalogue (from the user report's 340 scored foods) ----
  // Matched by category NAME string (the dict key in user.food_scores),
  // not array position — avoids relying on two independently-extracted
  // lists staying in the same order.
  const catIdByName = Object.fromEntries(FOOD_CATEGORIES.map(c => [c.name_en, c.id]));
  const foodIdByName = new Map();
  const foodRows = [];
  const unmatchedCategories = new Set();
  Object.entries(user.food_scores).forEach(([catName, items]) => {
    if (!catIdByName[catName]) unmatchedCategories.add(catName);
    items.forEach(it => {
      const id = slugify(it.food_name);
      foodIdByName.set(it.food_name, id);
      foodRows.push({ id, name_en: it.food_name, name_es: esNames?.[it.food_name] || it.food_name, category_id: catIdByName[catName] || null });
    });
  });
  if (unmatchedCategories.size) console.warn(`⚠ Unmatched food category names (category_id left null): ${[...unmatchedCategories].join(", ")}`);
  // upsert WITHOUT touching legacy category/score columns, so the
  // existing 6-week-plan catalog (src/data/foods.js) is untouched.
  const { error: foodErr } = await supabase.from("foods").upsert(foodRows);
  if (foodErr) throw foodErr;
  console.log(`Foods: ${foodRows.length}${esNames ? "" : " (name_es placeholder — re-run once translations land)"}`);

  // ---- 10. Client / kit / test shell (reuses the legacy-profile backfill if one already exists) ----
  let { data: existingTest } = await supabase
    .from("tests").select("id, client_id, kit_id")
    .eq("kit_id", (await supabase.from("kits").select("id").eq("kit_code", KIT_CODE).maybeSingle()).data?.id ?? "00000000-0000-0000-0000-000000000000")
    .maybeSingle();

  let clientId, kitId, testId;
  if (existingTest) {
    ({ id: testId, client_id: clientId, kit_id: kitId } = existingTest);
    console.log(`Reusing existing v2 test ${testId} for kit ${KIT_CODE}.`);
  } else {
    // If registerKitFromV2.mjs already ran for this kit (or an older
    // run of this script backfilled one), there's a real v1 profile
    // and possibly a claimed auth account — link the new clients row
    // to both now, instead of leaving it an orphan that nothing else
    // can find later (this bit anyone running these two scripts out
    // of order, or re-running after the other already ran).
    const { data: legacyProfile } = await supabase.from("profiles").select("id, user_id").eq("kit_code", KIT_CODE).maybeSingle();
    const { data: client, error: clientErr } = await supabase
      .from("clients").insert({
        name: CLIENT_NAME, language: "en",
        legacy_profile_id: legacyProfile?.id ?? null,
        auth_user_id: legacyProfile?.user_id ?? null,
      }).select().single();
    if (clientErr) throw clientErr;
    clientId = client.id;
    if (legacyProfile) console.log(`Linked new clients row to existing v1 profile ${legacyProfile.id}${legacyProfile.user_id ? ` (claimed, auth_user_id synced)` : " (unclaimed)"}.`);

    const { data: kit, error: kitErr } = await supabase
      .from("kits").upsert({ client_id: clientId, kit_code: KIT_CODE, status: "claimed" }, { onConflict: "kit_code" }).select().single();
    if (kitErr) throw kitErr;
    kitId = kit.id;

    const { data: test, error: testErr } = await supabase
      .from("tests").insert({
        kit_id: kitId, client_id: clientId, test_number: 1,
        report_date: doctor.report_meta.report_date, age_at_test: doctor.report_meta.age_at_test,
        parse_status: "parsed", published_at: new Date().toISOString(),
      }).select().single();
    if (testErr) throw testErr;
    testId = test.id;
    console.log(`Created client ${clientId} / kit ${kitId} / test ${testId}.`);
  }

  // ---- 11. source_documents ----
  const { error: sdErr } = await supabase.from("source_documents").upsert([
    { test_id: testId, type: "doctor", storage_path: "uploads/5d39d435-ELVMWB6271-_3.pdf", enbiosis_version: null, parsed_at: new Date().toISOString() },
    { test_id: testId, type: "user", storage_path: "uploads/a2ba41b1-ELVMWB6271-_2.pdf", enbiosis_version: null, parsed_at: new Date().toISOString() },
  ]);
  if (sdErr) throw sdErr;

  // ---- 12. metric_results + metric_markers ----
  const metricResultRows = doctor.headline_metrics.map(m => ({
    test_id: testId,
    metric_id: m.metric_id === "fb_ratio" ? "f_b_ratio" : m.metric_id,
    value: m.value, value_text: m.value_text, printed_badge: m.printed_badge, printed_comment: m.printed_comment, page: toPageInt(m.page),
  })).concat(doctor.gut_scores.map(g => ({
    test_id: testId, metric_id: g.metric_id, value: g.value, community_value: g.community_value,
    printed_badge: g.printed_badge, printed_comment: g.printed_comment, page: toPageInt(g.page_detail),
  })));
  const { error: mrErr } = await supabase.from("metric_results").upsert(metricResultRows, { onConflict: "test_id,metric_id" });
  if (mrErr) throw mrErr;

  const markerRows = doctor.gut_scores.flatMap(g => (g.markers || []).map(mk => ({ test_id: testId, metric_id: g.metric_id, label_en: mk.label, value: mk.value })));
  await supabase.from("metric_markers").delete().eq("test_id", testId);
  const { error: mkErr } = await supabase.from("metric_markers").insert(markerRows);
  if (mkErr) throw mkErr;
  console.log(`Metric results: ${metricResultRows.length}, markers: ${markerRows.length}`);

  // ---- 13. genus_abundance, key_bacteria, krona_abundance ----
  const genusRows = doctor.genus_abundance.map(g => ({ test_id: testId, taxon_id: touchTaxon(g.genus), client_pct: g.client_pct, world_pct: g.world_pct })).filter(r => r.taxon_id);
  const { error: gaErr } = await supabase.from("genus_abundance").upsert(genusRows, { onConflict: "test_id,taxon_id" });
  if (gaErr) throw gaErr;

  const keyBacteriaRows = doctor.key_bacteria.map(k => ({ test_id: testId, taxon_id: touchTaxon(k.taxon), client_score: k.client_score, community_score: k.community_score })).filter(r => r.taxon_id);
  const { error: kbErr } = await supabase.from("key_bacteria").upsert(keyBacteriaRows, { onConflict: "test_id,taxon_id" });
  if (kbErr) throw kbErr;

  await supabase.from("krona_abundance").delete().eq("test_id", testId);
  const kronaRows = doctor.krona_abundance.map(k => ({ test_id: testId, taxon_id: touchTaxon(k.taxon), pct: k.pct })).filter(r => r.taxon_id);
  const { error: krErr } = await supabase.from("krona_abundance").insert(kronaRows);
  if (krErr) throw krErr;
  console.log(`Genus abundance: ${genusRows.length}, key bacteria: ${keyBacteriaRows.length}, krona: ${kronaRows.length}`);

  // ---- 14. taxon_readings + taxon_status (resolve conflicts per spec rules) ----
  const readings = []; // { taxon_id, context_type, context_id, status, abundance_pct, page }
  Object.entries(doctor.safety_screen).forEach(([panelKey, panel]) => {
    panel.items.forEach(it => {
      const taxonId = touchTaxon(it.organism);
      if (!taxonId) return;
      readings.push({ taxon_id: taxonId, context_type: "screen", context_id: PANEL_ID_MAP[panelKey], status: STATUS_MAP[it.status === "not_detected" ? "Not Detected" : it.status] || it.status, abundance_pct: it.abundance_pct, page: toPageInt(panel.page) });
    });
  });
  Object.entries(doctor.pathway_tables).forEach(([key, table]) => {
    const conditionId = PATHWAY_KEY_TO_CONDITION[key];
    if (!conditionId) return;
    pathwayRows(table).forEach(r => {
      const taxonId = touchTaxon(r.taxon);
      if (!taxonId) return;
      readings.push({ taxon_id: taxonId, context_type: "pathway", context_id: conditionId, status: STATUS_MAP[r.status] || r.status.toLowerCase(), abundance_pct: null, page: toPageInt(table.page) });
    });
  });

  await supabase.from("taxon_readings").delete().eq("test_id", testId);
  const { error: trErr } = await supabase.from("taxon_readings").insert(readings.map(r => ({ test_id: testId, ...r })));
  if (trErr) throw trErr;

  // Resolve: a detected (low/normal/high) reading beats not_detected;
  // if detected readings disagree with each other, flag has_conflict.
  const byTaxon = new Map();
  readings.forEach(r => { (byTaxon.get(r.taxon_id) || byTaxon.set(r.taxon_id, []).get(r.taxon_id)).push(r.status); });
  const statusRows = [...byTaxon.entries()].map(([taxon_id, statuses]) => {
    const detected = statuses.filter(s => s !== "not_detected");
    const uniqueDetected = [...new Set(detected)];
    if (uniqueDetected.length === 0) return { test_id: testId, taxon_id, status: "not_detected", rule_applied: "only not_detected readings", has_conflict: false };
    if (uniqueDetected.length === 1) return { test_id: testId, taxon_id, status: uniqueDetected[0], rule_applied: "detected reading beats not_detected", has_conflict: statuses.includes("not_detected") };
    return { test_id: testId, taxon_id, status: uniqueDetected[0], rule_applied: "conflicting detected readings — see taxon_readings for all", has_conflict: true };
  });
  const { error: tsErr } = await supabase.from("taxon_status").upsert(statusRows, { onConflict: "test_id,taxon_id" });
  if (tsErr) throw tsErr;
  console.log(`Taxon readings: ${readings.length}, resolved taxon statuses: ${statusRows.length} (${statusRows.filter(r => r.has_conflict).length} flagged conflicts)`);

  // ---- 15. condition_results (risk analysis) ----
  // Explicit map, not a slugify heuristic — "Crohn's Disease",
  // "Trimethylamine (TMA) Conversion" and the GABA one don't survive
  // naive slugification (apostrophes, leading acronyms in parens).
  const RISK_CONDITION_TO_ID = {
    Diarrhea: "diarrhea", Gas: "gas", Constipation: "constipation", Bloating: "bloating",
    "Irritable Bowel Syndrome (IBS)": "irritable_bowel_syndrome",
    "Inflammatory Bowel Disease (IBD)": "inflammatory_bowel_disease",
    "Crohn's Disease": "crohns_disease", "Ulcerative Colitis": "ulcerative_colitis",
    Obesity: "obesity", "Type 2 Diabetes": "type_2_diabetes",
    "Coronary Heart Disease": "coronary_heart_disease", "Kidney Stone": "kidney_stone",
    "Butyric Acid Biosynthesis": "butyric_acid_biosynthesis",
    "Trimethylamine (TMA) Conversion": "tma_conversion",
    "Polyamine Biosynthesis": "polyamine_biosynthesis", "Propionate Biosynthesis": "propionate_biosynthesis",
    "Serotonin Biosynthesis": "serotonin_biosynthesis",
    "Gamma Aminobutyric Acid (GABA) Biosynthesis": "gaba_biosynthesis",
  };
  const conditionResultRows = [
    ...doctor.risk_analysis_conditions.symptoms_and_diseases,
    ...doctor.risk_analysis_conditions.biosynthesis_and_conversion,
  ].map(c => {
    const id = RISK_CONDITION_TO_ID[c.condition];
    if (!id) throw new Error(`No condition_id mapping for risk analysis condition "${c.condition}" — add it to RISK_CONDITION_TO_ID.`);
    return { test_id: testId, condition_id: id, at_risk: c.at_risk, flagged_taxon_ids: (c.flagged_taxa || []).map(slugify), printed_text: c.printed_text };
  });
  const { error: crErr } = await supabase.from("condition_results").upsert(conditionResultRows, { onConflict: "test_id,condition_id" });
  if (crErr) throw crErr;
  console.log(`Condition results: ${conditionResultRows.length}`);

  // ---- 16. similar_profile_results ----
  const similarResultRows = doctor.similar_profiles.map(p => ({ test_id: testId, similar_condition_id: slugify(p.condition), client_pct: p.client_pct, overall_pct: p.overall_pct }));
  const { error: spErr } = await supabase.from("similar_profile_results").upsert(similarResultRows, { onConflict: "test_id,similar_condition_id" });
  if (spErr) throw spErr;

  // ---- 17. screen_results ----
  const screenResultRows = [];
  Object.entries(doctor.safety_screen).forEach(([panelKey, panel]) => {
    const panelId = PANEL_ID_MAP[panelKey];
    const seen = new Set();
    panel.items.forEach(it => {
      const taxonId = touchTaxon(it.organism);
      const key = `${panelId}:${taxonId}`;
      if (!taxonId || seen.has(key)) return;
      seen.add(key);
      screenResultRows.push({ test_id: testId, panel_id: panelId, taxon_id: taxonId, status: it.status, abundance_pct: it.abundance_pct });
    });
  });
  const { error: srErr } = await supabase.from("screen_results").upsert(screenResultRows, { onConflict: "test_id,panel_id,taxon_id" });
  if (srErr) throw srErr;
  console.log(`Similar profile results: ${similarResultRows.length}, screen results: ${screenResultRows.length}`);

  // ---- 18. compound_scores, supplement_scores ----
  const compoundScoreRows = Object.values(compoundScoreRowsByGroup).flat().map(c => ({ test_id: testId, compound_id: c.id, score: c.score }));
  const { error: csErr } = await supabase.from("compound_scores").upsert(compoundScoreRows, { onConflict: "test_id,compound_id" });
  if (csErr) throw csErr;
  const supplementScoreRowsFinal = supplementScoreRows.map(s => ({ test_id: testId, supplement_id: s.id, score: s.score }));
  const { error: ssErr } = await supabase.from("supplement_scores").upsert(supplementScoreRowsFinal, { onConflict: "test_id,supplement_id" });
  if (ssErr) throw ssErr;
  console.log(`Compound scores: ${compoundScoreRows.length}, supplement scores: ${supplementScoreRowsFinal.length}`);

  // ---- 19. food_scores + food_highlights ----
  const foodScoreRows = [];
  Object.values(user.food_scores).flat().forEach(it => {
    const foodId = foodIdByName.get(it.food_name);
    if (foodId) foodScoreRows.push({ test_id: testId, food_id: foodId, score: it.score });
  });
  const { error: fsErr } = await supabase.from("food_scores").upsert(foodScoreRows, { onConflict: "test_id,food_id" });
  if (fsErr) throw fsErr;

  await supabase.from("food_highlights").delete().eq("test_id", testId);
  const highlightRows = Object.entries(user.food_highlights).flatMap(([list, items]) =>
    items.map(it => ({ test_id: testId, food_id: foodIdByName.get(it.food_name), list, position: it.position })).filter(r => r.food_id)
  );
  const { error: fhErr } = await supabase.from("food_highlights").insert(highlightRows);
  if (fhErr) throw fhErr;
  console.log(`Food scores: ${foodScoreRows.length}, food highlights: ${highlightRows.length}`);

  // ---- 20. report_comments (client-facing printed text) ----
  await supabase.from("report_comments").delete().eq("test_id", testId);
  const commentRows = doctor.headline_metrics
    .filter(m => m.printed_comment)
    .map(m => ({ test_id: testId, section_key: m.metric_id === "fb_ratio" ? "f_b_ratio" : m.metric_id, metric_id: m.metric_id === "fb_ratio" ? "f_b_ratio" : m.metric_id, text: m.printed_comment, language: "en", page: toPageInt(m.page), show_to_client: true }))
    .concat(doctor.gut_scores.filter(g => g.printed_comment).map(g => ({ test_id: testId, section_key: g.metric_id, metric_id: g.metric_id, text: g.printed_comment, language: "en", page: toPageInt(g.page_detail), show_to_client: true })));
  const { error: rcErr } = await supabase.from("report_comments").insert(commentRows);
  if (rcErr) throw rcErr;
  console.log(`Report comments: ${commentRows.length}`);

  // ---- 21. data_quality_issues ----
  await supabase.from("data_quality_issues").delete().eq("test_id", testId);
  const dqRows = doctor.data_quality_conflicts_expected.map(c => ({ test_id: testId, issue_type: c.type, detail: c.detail, resolved: false }));
  dqRows.push({ test_id: testId, issue_type: "extraction_gap", detail: doctor.references_lit.notes, resolved: false });
  dqRows.push({ test_id: testId, issue_type: "extraction_gap", detail: doctor.krona_abundance_reading_note || "Krona chart inner-ring percentages not legible.", resolved: false });
  dqRows.push({ test_id: testId, issue_type: "risk_analysis_inconsistency", detail: doctor.risk_analysis_conditions.notes, resolved: false });
  const { error: dqErr } = await supabase.from("data_quality_issues").insert(dqRows);
  if (dqErr) throw dqErr;
  console.log(`Data quality issues logged: ${dqRows.length}`);

  // ---- 22. Insight drafts, sourced ONLY from text already given to
  // this client (the report's own printed comments + the diet plan's
  // rationale) — never new clinical interpretation written by this
  // script. approved=true because nothing here is a new claim, just
  // the same text restructured into the theme-insight shape; author
  // is 'ai' (this script assembled it) for an honest paper trail.
  // Anything beyond this — new interpretive insights — is for a
  // nutritionist to write via the admin review panel. ----
  const HEADLINE_TITLES = {
    microbiome_age: ["Microbiome age", "Edad del microbioma"],
    wellness_index: ["Wellness index", "Índice de bienestar"],
    diversity: ["Diversity", "Diversidad"],
    fb_ratio: ["F/B ratio", "Ratio F/B"],
  };
  const HEADLINE_ES = {
    microbiome_age: "¡Parece que tu microbioma es más joven que tú! El plan de nutrición personalizado que hemos preparado para ti te ayudará a mantener tu microbioma joven por más tiempo.",
    wellness_index: "Tu Índice de Bienestar es alto, lo que indica un bajo riesgo de enfermedad crónica. El perfil de tu microbioma no está asociado con patrones microbianos vinculados a enfermedades crónicas.",
    diversity: "Baja, con necesidad de mejora: aunque tienes un nivel de diversidad bastante bajo, nuestro plan de nutrición personalizado te ayudará a mejorarlo y lograr un microbioma más diverso.",
    fb_ratio: "Tu ratio F/B es alto. Esto significa que los Firmicutes son más dominantes, lo que puede estar relacionado con una mayor extracción de calorías y una mayor tendencia al aumento de peso en algunas personas. ¡Con tu guía de nutrición personalizada es posible modular tu microbioma!",
  };
  await supabase.from("insights").delete().eq("test_id", testId);
  const insightRows = doctor.headline_metrics.filter(m => m.printed_comment).map(m => {
    const key = m.metric_id === "fb_ratio" ? "fb_ratio" : m.metric_id;
    return {
      test_id: testId, theme_id: "overview", status: m.printed_badge,
      title_en: HEADLINE_TITLES[key]?.[0] || key, title_es: HEADLINE_TITLES[key]?.[1] || key,
      client_text_en: m.printed_comment, client_text_es: HEADLINE_ES[key] || null,
      linked_metric_ids: [m.metric_id === "fb_ratio" ? "f_b_ratio" : m.metric_id],
      author: "ai", approved: true,
    };
  });
  if (existsSync(`${SCRATCH}/diet_plan_extracted_es.json`)) {
    const dietPlan = readJSON("diet_plan_extracted_es.json");
    if (dietPlan.notes?.rationale_intro) {
      insightRows.push({
        test_id: testId, theme_id: "overview", status: null,
        title_en: "Your plan, explained", title_es: "Tu plan, explicado",
        client_text_en: dietPlan.notes.rationale_intro, client_text_es: dietPlan.notes.rationale_intro_es || null,
        linked_metric_ids: ["metabolic_score", "protein_metabolism", "diversity"], author: "ai", approved: true,
      });
    }
  }
  // ---- 23. Condition-risk insight DRAFTS (unapproved — these DO
  // contain new interpretation, naming the specific bacteria behind
  // each at-risk condition flag from the risk-analysis table, so
  // unlike the block above they are NOT auto-approved. A client
  // never sees these until a nutritionist reviews and approves them
  // in the admin panel (insights_select_scoped RLS enforces this —
  // approved=false is invisible to the client role regardless of
  // what the app renders). ----
  const draftRows = conditionResultRows
    .filter(cr => cr.at_risk && cr.flagged_taxon_ids.length > 0)
    .map(cr => {
      const condition = CONDITIONS.find(c => c.id === cr.condition_id);
      if (!condition) return null;
      const names = cr.flagged_taxon_ids.map(id => taxaMap.get(id)?.name || id);
      const namesEn = joinNames(names, "en");
      const namesEs = joinNames(names, "es");
      const factorEn = names.length > 1 ? "factors" : "a factor";
      const factorEs = names.length > 1 ? "factores" : "un factor";
      return {
        // "act" (red, "Focus area") — not "watch" ("Within range", which
        // would directly contradict a risk-flag card saying a specific
        // bacterium was flagged as a factor. These conditions came from
        // the report's own at-risk flag, so the urgent framing is the
        // one that actually matches what's being said.
        test_id: testId, theme_id: condition.theme_id, status: "act",
        title_en: condition.name_en, title_es: condition.name_es,
        client_text_en: `Your report flags ${namesEn} as ${factorEn} associated with your ${condition.name_en} risk flag.`,
        client_text_es: `Tu informe señala ${namesEs} como ${factorEs} asociado${names.length > 1 ? "s" : ""} a tu indicador de riesgo de ${condition.name_es}.`,
        linked_condition_ids: [cr.condition_id], linked_taxon_ids: cr.flagged_taxon_ids,
        author: "ai", approved: false,
      };
    })
    .filter(Boolean);
  insightRows.push(...draftRows);

  // PostgREST builds a bulk insert's column list from the union of
  // keys across every row in the array — a row that omits a key
  // (relying on the column's db default) gets that key sent as an
  // explicit null instead once ANY other row in the same batch sets
  // it, which fails insights' not-null array columns. Normalize every
  // row to the same full key set so that can't happen.
  const normalizedInsightRows = insightRows.map(row => ({
    linked_metric_ids: [], linked_taxon_ids: [], linked_condition_ids: [], linked_food_ids: [],
    ...row,
  }));

  const { error: insErr } = await supabase.from("insights").insert(normalizedInsightRows);
  if (insErr) throw insErr;
  console.log(`Insight drafts seeded: ${insightRows.length} total (${insightRows.length - draftRows.length} auto-approved from already-given text, ${draftRows.length} condition-risk drafts awaiting nutritionist review)`);

  console.log(`\nDone. test_id = ${testId}, client_id = ${clientId}, kit_id = ${kitId}`);
  console.log(`\nNOTE: no v1 profiles row was created by this script — run scripts/registerKitFromV2.mjs next to also create the v1 self-serve-claimable profile (gut_scores/screening_findings/similar_profiles/plan) so the client can actually sign in and see their report in the current app UI.`);
}

main().catch(err => {
  console.error("seedReportV2 failed:", err.message || err);
  process.exit(1);
});
