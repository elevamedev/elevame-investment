import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

const EMPTY = { loading: true, todayCheckin: null, dailyQuestions: [], weeklyByQuestion: {}, habitRows: [] };

/**
 * How you feel sheet data (brief 4.9): today's average, one weekly
 * series per daily question from v_weekly_feel, and the habit/feel
 * correlation card from v_habit_insight (ready only after 5 done and
 * 5 skipped days).
 */
export function useV4Feel(clientId) {
  const [state, setState] = useState(EMPTY);

  const load = useCallback(async () => {
    if (!clientId) { setState({ ...EMPTY, loading: false }); return; }
    const todayStr = new Date().toISOString().slice(0, 10);

    const [{ data: settings }, { data: todayCheckin }, { data: weekly }, { data: habitInsight }] = await Promise.all([
      supabase.from("client_settings").select("daily_questions").eq("client_id", clientId).maybeSingle(),
      supabase.from("quick_checkins").select("*").eq("client_id", clientId).eq("day", todayStr).maybeSingle(),
      supabase.from("v_weekly_feel").select("*").eq("client_id", clientId).order("plan_week"),
      supabase.from("v_habit_insight").select("*").eq("client_id", clientId),
    ]);

    const dailyQuestions = settings?.daily_questions || ["digestion", "bloating", "energy", "sleep"];
    const weeklyByQuestion = {};
    dailyQuestions.forEach(q => {
      weeklyByQuestion[q] = (weekly || []).filter(w => w[q] != null).map(w => ({ week: w.plan_week, value: w[q] }));
    });

    const habitKeys = (habitInsight || []).map(h => h.habit_key);
    const { data: habits } = habitKeys.length ? await supabase.from("phase_habits").select("id,key,text_en,text_es").in("key", habitKeys) : { data: [] };
    const habitTextByKey = Object.fromEntries((habits || []).map(h => [h.key, h]));
    const habitRows = (habitInsight || []).map(h => ({ ...h, habit: habitTextByKey[h.habit_key] }));

    setState({ loading: false, todayCheckin: todayCheckin || null, dailyQuestions, weeklyByQuestion, habitRows });
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  return { ...state, refetch: load };
}
