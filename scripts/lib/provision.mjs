/**
 * Shared provisioning logic used by both scripts/seed.mjs (admin
 * creates a ready-to-use account) and scripts/registerKit.mjs
 * (staff registers a kit's report before the client has an account).
 * Everything here operates on a profiles.id (the internal id), not
 * an auth user id — the two are decoupled until a client claims
 * their kit.
 */
import { FOODS } from "../../src/data/foods.js";
import { PHASES } from "../../src/data/planTemplate.js";
import {
  GUT_SCORES_DEFAULT,
  KEY_BACTERIA_DEFAULT,
} from "../../src/data/gutScoresTemplate.js";

export async function upsertFoodsCatalog(supabase) {
  const rows = Object.entries(FOODS).map(([id, f]) => ({
    id, category: f.cat, score: f.score, name_en: f.en, name_es: f.es,
  }));
  const { error } = await supabase.from("foods").upsert(rows);
  if (error) throw error;
  return rows.length;
}

/**
 * Seeds the gut_scores + key_bacteria panel for a profile. `overrides`
 * is an optional map of score key -> { value, avg } to use in place
 * of the template's default numbers (labels/tags/notes always come
 * from the template — only the numbers are ever client-specific
 * here, by design, to avoid guessing clinically-wrong tags).
 */
export async function seedGutScores(supabase, profileId, overrides = {}) {
  await supabase.from("gut_scores").delete().eq("profile_id", profileId);
  const rows = [
    ...GUT_SCORES_DEFAULT.map((s, i) => ({ ...s, category: "gut_score", sortOrder: i })),
    ...KEY_BACTERIA_DEFAULT.map((s, i) => ({ ...s, category: "key_bacteria", sortOrder: i })),
  ].map(s => {
    const o = overrides[s.key];
    return {
      profile_id: profileId,
      category: s.category,
      key: s.key,
      label_en: s.label.en,
      label_es: s.label.es,
      value: o?.value ?? s.value,
      avg: o?.avg ?? s.avg,
      tag: s.tag,
      note_en: s.note.en,
      note_es: s.note.es,
      sort_order: s.sortOrder,
    };
  });
  const { error } = await supabase.from("gut_scores").insert(rows);
  if (error) throw error;
  return rows.length;
}

export async function seedPlan(supabase, profileId) {
  // Deleting plan_phases cascades to plan_days and plan_meals.
  await supabase.from("plan_phases").delete().eq("profile_id", profileId);

  for (let i = 0; i < PHASES.length; i++) {
    const phase = PHASES[i];
    const { data: phaseRow, error: phaseErr } = await supabase
      .from("plan_phases")
      .insert({
        profile_id: profileId,
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
  return PHASES.length;
}
