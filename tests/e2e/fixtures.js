// Synthetic fixtures for the e2e suite (brief section 9). Every value
// here is invented for testing — never real client data, and never
// the ELVMWB6271 kit this app was originally seeded from (standing
// constraint: no real client data in this repo). "main" and "second"
// are two distinct, unrelated synthetic clients, used by the
// cross-client isolation test (acceptance item 4).

function baseClient(id, { name, kitCode, bacteriumName, reviewed }) {
  const USER_ID = `${id}-user`;
  const CLIENT_ID = `${id}-client`;
  const PROFILE_ID = `${id}-profile`;
  const TEST_ID = `${id}-test`;
  const THEME_ID = "digestion";
  const METRIC_ID = `${id}-metric-bowel`;
  const TAXON_ID = `${id}-taxon`;

  return {
    USER_ID, CLIENT_ID,
    TABLES: {
      staff: [],
      themes: [{ id: THEME_ID, name_en: "Digestion", name_es: "" }],
      clients: [{ id: CLIENT_ID, auth_user_id: USER_ID, preferred_name: name }],
      profiles: [{
        id: PROFILE_ID, user_id: USER_ID, full_name: name, kit_code: kitCode, language: "en", plan_start_date: "2026-09-01",
        microbiome_age: 34, diversity_value: 7.2, wellness_index: "good",
      }],
      plan_phases: [{ id: `${id}-phase-1`, profile_id: PROFILE_ID, phase_key: "phase_1", phase_index: 0, start_day: 1, weeks_en: "Weeks 1-2", weeks_es: "", subtitle_en: "", subtitle_es: "", blurb_en: "", blurb_es: "" }],
      plan_days: [], plan_meals: [], plan_meal_items: [],
      gut_scores: [], screening_findings: [], similar_profiles: [], shopping_checks: [], tracker_entries: [], milestones: [],
      tests: [{ id: TEST_ID, client_id: CLIENT_ID, test_number: 1, published_at: "2026-10-01T00:00:00Z" }],
      metrics: [{ id: METRIC_ID, key: "bowel_motility", theme_id: THEME_ID, client_group: "digestion", client_name_en: "Bowel motility", client_name_es: "", plain_en: `How fast food moves through ${name}`, plain_es: "", sort_order: 1 }],
      metric_results: [{ test_id: TEST_ID, metric_id: METRIC_ID, value: 6.5 }],
      metric_markers: [],
      taxa: [{ id: TAXON_ID, name: bacteriumName }],
      taxon_profiles: [{ taxon_id: TAXON_ID, portal_name: bacteriumName, genus_en: bacteriumName, genus_es: "", role: "key" }],
      taxon_facts: [],
      key_bacteria: [{ taxon_id: TAXON_ID, test_id: TEST_ID, gut_score: 7, important: true }],
      taxon_readings: [{ taxon_id: TAXON_ID, test_id: TEST_ID, context_type: "report", context_id: null, status: "detected", level: "normal" }],
      v_taxon_level: [{ taxon_id: TAXON_ID, test_id: TEST_ID, level: "low" }],
      v_score_taxa: [],
      body_system_status: [{ test_id: TEST_ID, theme_id: THEME_ID, status: "watch", line_en: `${name}'s digestion, in short`, line_es: "", reviewed_at: reviewed ? "2026-10-02T00:00:00Z" : null }],
      body_system_signals: [{
        id: `${id}-signal-1`, test_id: TEST_ID, theme_id: THEME_ID, sort_order: 0,
        title_en: `${name}'s digestion signal`, title_es: "", metric_id: METRIC_ID, status: "watch",
        verdict_en: `What ${name}'s test shows about digestion`, verdict_es: "",
        reviewed_at: reviewed ? "2026-10-02T00:00:00Z" : null,
      }],
      conditions: [{ id: `${id}-condition-1`, name_en: "bloating", name_es: "" }],
      signal_taxa: [{ signal_id: `${id}-signal-1`, taxon_id: TAXON_ID, relation: "less_with", condition_id: `${id}-condition-1` }],
      body_system_levers: [], body_system_lever_foods: [],
      body_system_education: [{ theme_id: THEME_ID, hook_en: "Why digestion varies", hook_es: "", why_short_en: "", why_short_es: "", why_more_en: "", why_more_es: "" }],
      education_facts: [],
      insights: [], insight_foods: [], client_goals: [], goal_catalog: [],
      client_settings: [{
        client_id: CLIENT_ID, language: "en", theme: "light", text_size: "standard", timezone: "Europe/Madrid",
        meal_reminders: true, daily_reminder: true, phase_checkin_reminders: true, weekly_summary: true, shopping_reminder: false,
        share_with_nutritionist: true, daily_questions: ["digestion", "bloating", "energy", "sleep"],
      }],
      weight_goals: [], client_intolerances: [], consents: [],
      quick_checkins: [], symptom_checkins: [],
      v_weekly_feel: [
        { client_id: CLIENT_ID, plan_week: 1, digestion: 2.6, bloating: 2.4, energy: 3.0, sleep: 3.1 },
        { client_id: CLIENT_ID, plan_week: 2, digestion: 3.4, bloating: 3.1, energy: 3.2, sleep: 3.3 },
      ],
      v_habit_insight: [], phase_habits: [], habit_logs: [],
      screen_results: [], screen_items: [], screen_panels: [],
      foods: [], food_categories: [], food_scores: [], food_review_flags: [],
      clinician_clients: [], deletion_log: [],
    },
  };
}

export function mainFixture() {
  return baseClient("main", { name: "Jordan Rivera", kitCode: "ELVMTEST0001", bacteriumName: "Faecalibacterium", reviewed: true });
}

export function secondClientFixture() {
  return baseClient("second", { name: "Sam Okafor", kitCode: "ELVMTEST0002", bacteriumName: "Bacteroides", reviewed: true });
}

export function unreviewedFixture() {
  return baseClient("unreviewed", { name: "Robin Chen", kitCode: "ELVMTEST0003", bacteriumName: "Akkermansia", reviewed: false });
}

// A signed-in auth user with no claimed kit yet, so RequireClient shows
// LinkKitView — used by the 3-kit-error tests (acceptance item 8).
export function noProfileFixture() {
  const built = baseClient("noprofile", { name: "No One Yet", kitCode: "ELVMTEST0004", bacteriumName: "Prevotella", reviewed: true });
  built.TABLES.profiles = [];
  built.TABLES.clients = [];
  return built;
}

export const FIXTURES = { main: mainFixture, second: secondClientFixture, unreviewed: unreviewedFixture, noProfile: noProfileFixture };
