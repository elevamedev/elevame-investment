import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

function buildPhasesFromRows(phaseRows, dayRows, mealRows) {
  const mealsByDay = {};
  mealRows.forEach(m => {
    (mealsByDay[m.day_id] ||= []).push(m);
  });
  Object.values(mealsByDay).forEach(list => list.sort((a, b) => a.meal_order - b.meal_order));

  const daysByPhase = {};
  dayRows.forEach(d => {
    (daysByPhase[d.phase_id] ||= []).push(d);
  });
  Object.values(daysByPhase).forEach(list => list.sort((a, b) => a.day_index - b.day_index));

  return phaseRows
    .slice()
    .sort((a, b) => a.phase_index - b.phase_index)
    .map(p => ({
      id: p.phase_key,
      weeks: { en: p.weeks_en, es: p.weeks_es },
      subtitle: { en: p.subtitle_en, es: p.subtitle_es },
      blurb: { en: p.blurb_en, es: p.blurb_es },
      startDay: p.start_day,
      days: (daysByPhase[p.id] || []).map(d => ({
        tip: d.tip_en ? { en: d.tip_en, es: d.tip_es } : null,
        meals: (mealsByDay[d.id] || []).map(m => ({
          labelKey: m.label_key,
          dish: { en: m.dish_en, es: m.dish_es },
          desc: m.desc_en ? { en: m.desc_en, es: m.desc_es } : null,
          foods: m.foods || [],
        })),
      })),
    }));
}

function buildScoreList(rows) {
  return rows
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(r => ({
      key: r.key,
      label: { en: r.label_en, es: r.label_es },
      value: r.value,
      avg: r.avg,
      tag: r.tag,
      note: { en: r.note_en, es: r.note_es },
    }));
}

const EMPTY = {
  profile: null,
  phases: [],
  gutScores: [],
  keyBacteria: [],
  checks: {},
  entries: [],
  milestones: {},
};

export function useClientData(userId) {
  const [state, setState] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!userId) { setState(EMPTY); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [
        { data: profile, error: profileErr },
        { data: phaseRows, error: phasesErr },
        { data: scoreRows, error: scoresErr },
        { data: checkRows, error: checksErr },
        { data: entryRows, error: entriesErr },
        { data: milestoneRows, error: milestonesErr },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("plan_phases").select("*").eq("profile_id", userId),
        supabase.from("gut_scores").select("*").eq("profile_id", userId),
        supabase.from("shopping_checks").select("*").eq("profile_id", userId),
        supabase.from("tracker_entries").select("*").eq("profile_id", userId).order("date"),
        supabase.from("milestones").select("*").eq("profile_id", userId),
      ]);
      if (profileErr) throw profileErr;
      if (phasesErr) throw phasesErr;
      if (scoresErr) throw scoresErr;
      if (checksErr) throw checksErr;
      if (entriesErr) throw entriesErr;
      if (milestonesErr) throw milestonesErr;

      const phaseIds = phaseRows.map(p => p.id);
      let dayRows = [];
      let mealRows = [];
      if (phaseIds.length) {
        const { data: days, error: daysErr } = await supabase.from("plan_days").select("*").in("phase_id", phaseIds);
        if (daysErr) throw daysErr;
        dayRows = days;
        const dayIds = dayRows.map(d => d.id);
        if (dayIds.length) {
          const { data: meals, error: mealsErr } = await supabase.from("plan_meals").select("*").in("day_id", dayIds);
          if (mealsErr) throw mealsErr;
          mealRows = meals;
        }
      }

      const checks = {};
      checkRows.forEach(c => {
        if (!c.checked) return;
        (checks[c.phase_key] ||= {})[c.food_id] = true;
      });

      const milestones = {};
      milestoneRows.forEach(m => { milestones[m.milestone_id] = m; });

      setState({
        profile,
        phases: buildPhasesFromRows(phaseRows, dayRows, mealRows),
        gutScores: buildScoreList(scoreRows.filter(r => r.category === "gut_score")),
        keyBacteria: buildScoreList(scoreRows.filter(r => r.category === "key_bacteria")),
        checks,
        entries: entryRows,
        milestones,
      });
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function updateProfile(patch) {
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", userId).select().single();
    if (error) throw error;
    setState(s => ({ ...s, profile: data }));
  }

  async function toggleShoppingCheck(phaseKey, foodId) {
    const isChecked = !!state.checks[phaseKey]?.[foodId];
    const next = !isChecked;
    setState(s => {
      const phaseChecks = { ...(s.checks[phaseKey] || {}) };
      if (next) phaseChecks[foodId] = true; else delete phaseChecks[foodId];
      return { ...s, checks: { ...s.checks, [phaseKey]: phaseChecks } };
    });
    const { error } = await supabase.from("shopping_checks").upsert({
      profile_id: userId, phase_key: phaseKey, food_id: foodId, checked: next, updated_at: new Date().toISOString(),
    });
    if (error) setError(error);
  }

  async function resetShoppingPhase(phaseKey) {
    setState(s => ({ ...s, checks: { ...s.checks, [phaseKey]: {} } }));
    const { error } = await supabase.from("shopping_checks").delete().eq("profile_id", userId).eq("phase_key", phaseKey);
    if (error) setError(error);
  }

  async function saveTrackerEntry(date, form) {
    const row = { profile_id: userId, date, ...form, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from("tracker_entries").upsert(row).select().single();
    if (error) { setError(error); return; }
    setState(s => ({
      ...s,
      entries: [...s.entries.filter(e => e.date !== date), data].sort((a, b) => a.date.localeCompare(b.date)),
    }));
  }

  async function saveMilestoneEntry(milestoneId, form) {
    const row = {
      profile_id: userId, milestone_id: milestoneId, date: new Date().toISOString().slice(0, 10),
      ...form, updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("milestones").upsert(row).select().single();
    if (error) { setError(error); return; }
    setState(s => ({ ...s, milestones: { ...s.milestones, [milestoneId]: data } }));
  }

  return {
    ...state,
    loading,
    error,
    refetch: load,
    updateProfile,
    toggleShoppingCheck,
    resetShoppingPhase,
    saveTrackerEntry,
    saveMilestoneEntry,
  };
}
