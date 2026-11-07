import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { writeOrQueue } from "../lib/offlineQueue.js";

export const CHECKIN_FIELDS = ["digestion", "gas", "heaviness", "bowel_comfort", "energy", "sleep", "mood", "processed_snacks", "notes"];

function milestoneDueDay(phases, key) {
  if (key === "baseline") return 1;
  if (key === "end_phase_1") return phases[1] ? phases[1].start_day - 1 : 42;
  if (key === "end_phase_2") return phases[2] ? phases[2].start_day - 1 : 42;
  return 42; // end_phase_3: the plan's end, not the last phase's end
}

/** Brief 4.10: a phase check in opens on the last day of its phase and stays open for 7 days. Baseline has no plan day yet, so it's always open. */
function isWindowOpen(key, dueDay, planDay) {
  if (key === "baseline") return true;
  return planDay >= dueDay && planDay <= dueDay + 7;
}

const EMPTY = { loading: true, isOpen: false, dueDay: null, existing: null, baselineDigestion: null };

export function useV4Checkin(clientId, profileId, planStartDate, milestoneKey) {
  const [state, setState] = useState(EMPTY);

  const load = useCallback(async () => {
    if (!clientId || !profileId) { setState({ ...EMPTY, loading: false }); return; }

    const start = new Date(planStartDate || new Date().toISOString().slice(0, 10)); start.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const planDay = Math.min(Math.max(Math.floor((today - start) / 86400000), 0), 41) + 1;

    const { data: phases } = await supabase.from("plan_phases").select("start_day").eq("profile_id", profileId).order("phase_index");
    const dueDay = milestoneDueDay(phases || [], milestoneKey);
    const open = isWindowOpen(milestoneKey, dueDay, planDay);

    const { data: existing } = await supabase.from("symptom_checkins").select("*").eq("client_id", clientId).eq("kind", "milestone").eq("milestone", milestoneKey).maybeSingle();

    let baselineDigestion = null;
    if (milestoneKey !== "baseline") {
      const { data: baseline } = await supabase.from("symptom_checkins").select("digestion").eq("client_id", clientId).eq("kind", "milestone").eq("milestone", "baseline").maybeSingle();
      baselineDigestion = baseline?.digestion ?? null;
    }

    setState({ loading: false, isOpen: open, dueDay, existing: existing || null, baselineDigestion, planDay });
  }, [clientId, profileId, planStartDate, milestoneKey]);

  useEffect(() => { load(); }, [load]);

  async function submit(answers, testId) {
    const payload = { client_id: clientId, test_id: testId, kind: "milestone", milestone: milestoneKey, ...answers };
    if (state.existing) {
      await supabase.from("symptom_checkins").update(answers).eq("client_id", clientId).eq("kind", "milestone").eq("milestone", milestoneKey);
    } else {
      await writeOrQueue("symptom_checkins", "insert", payload);
    }
    await load();
  }

  return { ...state, submit, refetch: load };
}
