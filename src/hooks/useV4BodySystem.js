import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

const GOAL_KEY_BY_THEME = { digestion: "digestion_comfort", inflammation: "gut_lining", metabolism: "weight_sugar" };
const SNACK_LABEL = { none: "0", one_two: "1-2", three_five: "3-5", six_plus: "6+" };

const EMPTY = {
  loading: true, hasReport: false, theme: null, status: null, education: null, facts: [],
  signals: [], otherScores: [], levers: [], goalInsight: null, goalFollowed: false, howItsGoing: null,
};

/**
 * Body system page (brief 4.2/4.6): one theme's signals with their
 * bacteria, its other scores, levers, goal bar and "how it's going".
 */
export function useV4BodySystem(clientId, testId, themeId) {
  const [state, setState] = useState(EMPTY);

  const load = useCallback(async () => {
    if (!testId || !themeId) { setState({ ...EMPTY, loading: false }); return; }

    const [{ data: theme }, { data: status }, { data: education }, { data: signals }, { data: metrics }, { data: results }, { data: markers }, { data: levers }] = await Promise.all([
      supabase.from("themes").select("*").eq("id", themeId).maybeSingle(),
      supabase.from("body_system_status").select("*").eq("test_id", testId).eq("theme_id", themeId).maybeSingle(),
      supabase.from("body_system_education").select("*").eq("theme_id", themeId).maybeSingle(),
      supabase.from("body_system_signals").select("*").eq("test_id", testId).eq("theme_id", themeId).order("sort_order"),
      supabase.from("metrics").select("*").eq("theme_id", themeId).eq("client_group", "body_system"),
      supabase.from("metric_results").select("*").eq("test_id", testId),
      supabase.from("metric_markers").select("*").eq("test_id", testId),
      supabase.from("body_system_levers").select("*").eq("test_id", testId).eq("theme_id", themeId).order("sort_order"),
    ]);

    const signalIds = (signals || []).map(s => s.id);
    const leverIds = (levers || []).map(l => l.id);
    const [{ data: signalTaxa }, { data: leverFoods }, { data: educationFacts }] = await Promise.all([
      signalIds.length ? supabase.from("signal_taxa").select("*").in("signal_id", signalIds).order("sort_order") : Promise.resolve({ data: [] }),
      leverIds.length ? supabase.from("body_system_lever_foods").select("*").in("lever_id", leverIds).order("sort_order") : Promise.resolve({ data: [] }),
      supabase.from("education_facts").select("*").eq("theme_id", themeId).order("sort_order"),
    ]);

    const taxonIds = [...new Set((signalTaxa || []).map(t => t.taxon_id))];
    const conditionIds = [...new Set((signalTaxa || []).map(t => t.condition_id).filter(Boolean))];
    const foodIds = [...new Set((leverFoods || []).map(f => f.food_id))];
    const [{ data: taxa }, { data: profiles }, { data: levels }, { data: conditions }, { data: facts }, { data: foods }, { data: scoreTaxaRows }] = await Promise.all([
      taxonIds.length ? supabase.from("taxa").select("id,name").in("id", taxonIds) : Promise.resolve({ data: [] }),
      taxonIds.length ? supabase.from("taxon_profiles").select("*").in("taxon_id", taxonIds) : Promise.resolve({ data: [] }),
      taxonIds.length ? supabase.from("v_taxon_level").select("taxon_id,level").eq("test_id", testId).in("taxon_id", taxonIds) : Promise.resolve({ data: [] }),
      conditionIds.length ? supabase.from("conditions").select("id,name_en,name_es").in("id", conditionIds) : Promise.resolve({ data: [] }),
      taxonIds.length ? supabase.from("taxon_facts").select("*").in("taxon_id", taxonIds).order("sort_order") : Promise.resolve({ data: [] }),
      foodIds.length ? supabase.from("foods").select("id,name_en,name_es").in("id", foodIds) : Promise.resolve({ data: [] }),
      signals?.some(s => s.metric_id) ? supabase.from("v_score_taxa").select("*").in("metric_id", (signals || []).map(s => s.metric_id).filter(Boolean)) : Promise.resolve({ data: [] }),
    ]);

    const taxaById = Object.fromEntries((taxa || []).map(t => [t.id, t]));
    const profilesByTaxon = Object.fromEntries((profiles || []).map(p => [p.taxon_id, p]));
    const levelByTaxon = Object.fromEntries((levels || []).map(l => [l.taxon_id, l.level]));
    const conditionsById = Object.fromEntries((conditions || []).map(c => [c.id, c]));
    const factsByTaxon = {};
    (facts || []).forEach(f => { (factsByTaxon[f.taxon_id] ||= []).push(f); });

    const resultsByMetric = Object.fromEntries((results || []).map(r => [r.metric_id, r]));
    const markersByMetric = {};
    (markers || []).forEach(m => { (markersByMetric[m.metric_id] ||= []).push(m); });

    const signalsEnriched = (signals || []).map(s => {
      const bacteria = (signalTaxa || []).filter(st => st.signal_id === s.id).map(st => ({
        ...st, name: taxaById[st.taxon_id]?.name || st.taxon_id,
        role: profilesByTaxon[st.taxon_id]?.role, level: levelByTaxon[st.taxon_id],
        plainEn: profilesByTaxon[st.taxon_id]?.plain_en, plainEs: profilesByTaxon[st.taxon_id]?.plain_es,
        conditionName: st.condition_id ? conditionsById[st.condition_id] : null,
        facts: (factsByTaxon[st.taxon_id] || []).map(f => ({ label: f.kind === "note" ? "good_to_know" : f.kind, text: f.text_en, textEs: f.text_es })),
      }));
      const shownTaxonIds = new Set(bacteria.map(b => b.taxon_id));
      const extraCount = s.metric_id ? (scoreTaxaRows || []).filter(r => r.metric_id === s.metric_id && !shownTaxonIds.has(r.taxon_id)).length : 0;
      const extraTaxa = s.metric_id ? (scoreTaxaRows || []).filter(r => r.metric_id === s.metric_id && !shownTaxonIds.has(r.taxon_id)) : [];
      return { ...s, bacteria, extraCount, extraTaxa, result: s.metric_id ? resultsByMetric[s.metric_id] : null, markers: s.metric_id ? markersByMetric[s.metric_id] || [] : [] };
    });

    const signalMetricIds = new Set((signals || []).map(s => s.metric_id).filter(Boolean));
    const otherScores = (metrics || [])
      .filter(m => !signalMetricIds.has(m.id) && resultsByMetric[m.id])
      .map(m => ({ metric: m, result: resultsByMetric[m.id], markers: markersByMetric[m.id] || [] }));

    const leversEnriched = (levers || []).map(l => ({
      ...l, foods: (leverFoods || []).filter(lf => lf.lever_id === l.id).map(lf => ({ ...lf, food: foods.find(f => f.id === lf.food_id) })),
    }));

    const goalKey = GOAL_KEY_BY_THEME[themeId];
    let goalInsight = null, goalFollowed = false, howItsGoing = null;
    if (goalKey) {
      const [{ data: insight }, { data: goalRow }] = await Promise.all([
        supabase.from("insights").select("*").eq("test_id", testId).eq("key", goalKey).eq("approved", true).maybeSingle(),
        clientId ? supabase.from("client_goals").select("*").eq("client_id", clientId).eq("goal_key", goalKey).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      if (insight) {
        const { data: insightFoods } = await supabase.from("insight_foods").select("*").eq("insight_id", insight.id).order("sort_order");
        const foodIds2 = (insightFoods || []).map(f => f.food_id);
        const { data: planFoods } = foodIds2.length ? await supabase.from("foods").select("id,name_en,name_es").in("id", foodIds2) : { data: [] };
        goalInsight = { ...insight, foods: (insightFoods || []).map(f => ({ ...f, food: planFoods.find(pf => pf.id === f.food_id) })) };
        goalFollowed = goalRow?.status === "active" && !!goalRow?.confirmed_at;

        if (clientId) {
          if (insight.tracking === "feel") {
            const [{ data: baseline }, { data: recent }] = await Promise.all([
              supabase.from("symptom_checkins").select("digestion").eq("client_id", clientId).eq("kind", "milestone").eq("milestone", "baseline").maybeSingle(),
              supabase.from("quick_checkins").select("digestion").eq("client_id", clientId).order("day", { ascending: false }).limit(7),
            ]);
            const recentVals = (recent || []).map(r => r.digestion).filter(v => v != null);
            howItsGoing = {
              tracking: "feel",
              baseline: baseline?.digestion ?? null,
              now: recentVals.length ? Math.round((recentVals.reduce((a, b) => a + b, 0) / recentVals.length) * 10) / 10 : null,
            };
          } else if (insight.tracking === "behaviour") {
            const { data: lastCheckin } = await supabase.from("symptom_checkins").select("processed_snacks").eq("client_id", clientId).eq("kind", "milestone").order("created_at", { ascending: false }).limit(1);
            const snacks = lastCheckin?.[0]?.processed_snacks;
            howItsGoing = { tracking: "behaviour", processedSnacks: snacks ? SNACK_LABEL[snacks] || snacks : null };
          }
        }
      }
    }

    setState({
      loading: false, hasReport: true, theme, status, education, facts: educationFacts || [],
      signals: signalsEnriched, otherScores, levers: leversEnriched, goalInsight, goalFollowed, howItsGoing,
    });
  }, [clientId, testId, themeId]);

  useEffect(() => { load(); }, [load]);

  async function followGoal() {
    const goalKey = GOAL_KEY_BY_THEME[themeId];
    if (!goalKey || !clientId) return;
    const { data: existing } = await supabase.from("client_goals").select("*").eq("client_id", clientId).eq("goal_key", goalKey).maybeSingle();
    if (existing) await supabase.from("client_goals").update({ status: "active", confirmed_at: new Date().toISOString() }).eq("client_id", clientId).eq("goal_key", goalKey);
    else await supabase.from("client_goals").insert({ client_id: clientId, goal_key: goalKey, source: "client", status: "active", confirmed_at: new Date().toISOString() });
    await load();
  }

  return { ...state, followGoal, refetch: load };
}
