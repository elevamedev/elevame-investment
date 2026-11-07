import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

const HOME_THEME_IDS = ["digestion", "inflammation", "metabolism", "heart", "mind"];

// insights.key (goal key) for each theme that has one in the current
// catalogue (redesign.sql: digestion_comfort | diversity | gut_lining |
// weight_sugar). Heart and Mind have no matching goal key yet, so
// "Your goal · " never shows for them under today's goal catalogue —
// not a bug, just nothing to follow there yet. Not modelled as a
// theme->goal_key column anywhere, so this mapping is a brief gap
// filled here rather than in the schema.
const GOAL_KEY_BY_THEME = { digestion: "digestion_comfort", inflammation: "gut_lining", metabolism: "weight_sugar" };

const MILESTONE_ORDER = ["baseline", "end_phase_1", "end_phase_2", "end_phase_3"];

function isoDate(d) { return d.toISOString().slice(0, 10); }

function milestoneDueDay(phases, key) {
  if (key === "baseline") return 1;
  if (key === "end_phase_1") return phases[1] ? phases[1].start_day - 1 : 42;
  if (key === "end_phase_2") return phases[2] ? phases[2].start_day - 1 : 42;
  return 42; // end_phase_3: the plan's end, not the last phase's end
}

// Brief: "A check in whose window closed unanswered shows 'Missed' for
// 7 days, then disappears." The window's own length isn't specified
// elsewhere, so this is a brief gap filled here: open from 2 days
// before the due day, stays current through 7 days after, then
// "missed" for 7 more days, then gone.
function milestoneState(dueDay, planDay) {
  if (planDay < dueDay - 2) return "future";
  if (planDay <= dueDay + 7) return "current";
  if (planDay <= dueDay + 14) return "missed";
  return "gone";
}

const EMPTY = {
  loading: true, client: null, dailyQuestions: ["digestion", "bloating", "energy", "sleep"],
  checkinStreakDays: 0, todayCheckin: null, weeklyRows: [], goalKeyFollowed: {},
  comingUpMilestone: null, bodySystems: [],
};

/**
 * Home-screen-only data (brief 4.1): everything beyond the plan/foods
 * data Home shares with Plan and Foods (passed in rather than
 * refetched — see useV4Plan's `phases`/`habits`/etc and useFoodsData).
 */
export function useV4Home(clientId, testId, planDay, phases) {
  const [state, setState] = useState(EMPTY);

  const load = useCallback(async () => {
    if (!clientId) { setState({ ...EMPTY, loading: false }); return; }

    const todayStr = isoDate(new Date());

    const [{ data: client }, { data: settings }, { data: streakRow }, { data: todayCheckin }, { data: weeklyRows }, { data: goals }, { data: milestoneRows }] = await Promise.all([
      supabase.from("clients").select("preferred_name,name").eq("id", clientId).maybeSingle(),
      supabase.from("client_settings").select("daily_questions,timezone").eq("client_id", clientId).maybeSingle(),
      supabase.from("v_checkin_streak").select("streak_days").eq("client_id", clientId).maybeSingle(),
      supabase.from("quick_checkins").select("*").eq("client_id", clientId).eq("day", todayStr).maybeSingle(),
      supabase.rpc("adoption_weekly", { p_client_id: clientId }),
      supabase.from("client_goals").select("goal_key,status,confirmed_at").eq("client_id", clientId),
      supabase.from("symptom_checkins").select("milestone").eq("client_id", clientId).eq("kind", "milestone"),
    ]);

    const goalKeyFollowed = {};
    (goals || []).forEach(g => { goalKeyFollowed[g.goal_key] = g.status === "active" && !!g.confirmed_at; });

    const answeredMilestones = new Set((milestoneRows || []).map(m => m.milestone));
    let comingUpMilestone = null;
    for (const key of MILESTONE_ORDER) {
      if (answeredMilestones.has(key)) continue;
      const dueDay = milestoneDueDay(phases || [], key);
      const s = milestoneState(dueDay, planDay);
      if (s === "current" || s === "missed") { comingUpMilestone = { key, dueDay, state: s }; break; }
    }

    let bodySystems = [];
    if (testId) {
      const [{ data: statusRows }, { data: themeRows }, { data: educationRows }] = await Promise.all([
        supabase.from("body_system_status").select("*").eq("test_id", testId).in("theme_id", HOME_THEME_IDS),
        supabase.from("themes").select("id,name_en,name_es").in("id", HOME_THEME_IDS),
        supabase.from("body_system_education").select("theme_id,image_url,image_alt_en,image_alt_es").in("theme_id", HOME_THEME_IDS),
      ]);
      const themesById = Object.fromEntries((themeRows || []).map(t => [t.id, t]));
      const educationByTheme = Object.fromEntries((educationRows || []).map(e => [e.theme_id, e]));
      bodySystems = (statusRows || [])
        .filter(r => r.reviewed_at) // brief: a system not yet reviewed doesn't show
        .map(r => ({
          themeId: r.theme_id, status: r.status, lineEn: r.line_en, lineEs: r.line_es,
          name: themesById[r.theme_id], image: educationByTheme[r.theme_id],
          followed: !!goalKeyFollowed[GOAL_KEY_BY_THEME[r.theme_id]],
        }))
        .sort((a, b) => HOME_THEME_IDS.indexOf(a.themeId) - HOME_THEME_IDS.indexOf(b.themeId));
    }

    setState({
      loading: false, client, dailyQuestions: settings?.daily_questions || EMPTY.dailyQuestions,
      checkinStreakDays: streakRow?.streak_days || 0, todayCheckin: todayCheckin || null,
      weeklyRows: weeklyRows || [], goalKeyFollowed, comingUpMilestone, bodySystems,
    });
  }, [clientId, testId, planDay, phases]);

  useEffect(() => { load(); }, [load]);

  async function saveDailyCheckin(answers) {
    const todayStr = isoDate(new Date());
    await supabase.from("quick_checkins").upsert({ client_id: clientId, day: todayStr, ...answers });
    await load();
  }

  async function saveMilestoneCheckin(milestoneKey, answers) {
    await supabase.from("symptom_checkins").insert({ client_id: clientId, test_id: testId, kind: "milestone", milestone: milestoneKey, ...answers });
    await load();
  }

  return { ...state, saveDailyCheckin, saveMilestoneCheckin, refetch: load };
}
