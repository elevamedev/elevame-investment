import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

const THEME_GROUP = { digestion: "digestion", inflammation: "gut_lining", metabolism: "weight", mind: "mind_sleep" };

const EMPTY = {
  loading: true, hasReport: false,
  microbiomeAge: null, ageAtTest: null, diversityValue: null, wellnessIndex: null,
  scoreGroups: [], habitScores: [], keyBacteria: [], screenTotal: 0, screenDetected: 0, reportTexts: {},
};

/**
 * My gut (brief 4.5/4.7): the 13 scores grouped by body system, the
 * 3 habit-mirror scores, key bacteria sorted by client/community gap,
 * and the safety screen's detected count. Read-only — no writes.
 */
export function useV4Gut(profileId, testId) {
  const [state, setState] = useState(EMPTY);

  const load = useCallback(async () => {
    if (!profileId) { setState({ ...EMPTY, loading: false }); return; }

    const { data: profile } = await supabase.from("profiles").select("microbiome_age,diversity_value,wellness_index").eq("id", profileId).maybeSingle();

    if (!testId) {
      setState({ ...EMPTY, loading: false, hasReport: false, microbiomeAge: profile?.microbiome_age ?? null, diversityValue: profile?.diversity_value ?? null, wellnessIndex: profile?.wellness_index ?? null });
      return;
    }

    const [{ data: test }, { data: metrics }, { data: results }, { data: markers }, { data: keyBact }, { data: levels }, { data: taxa }, { data: profiles }, { data: screenRows }, { data: texts }] = await Promise.all([
      supabase.from("tests").select("age_at_test").eq("id", testId).maybeSingle(),
      supabase.from("metrics").select("*").in("client_group", ["body_system", "habit_mirror"]).order("sort_order"),
      supabase.from("metric_results").select("*").eq("test_id", testId),
      supabase.from("metric_markers").select("*").eq("test_id", testId),
      supabase.from("key_bacteria").select("*").eq("test_id", testId),
      supabase.from("v_taxon_level").select("taxon_id,level").eq("test_id", testId),
      supabase.from("taxa").select("id,name"),
      supabase.from("taxon_profiles").select("taxon_id,role,plain_en,plain_es"),
      supabase.from("screen_results").select("taxon_id,status").eq("test_id", testId),
      supabase.from("report_texts").select("key,text_en,text_es").eq("test_id", testId),
    ]);

    const resultsByMetric = Object.fromEntries((results || []).map(r => [r.metric_id, r]));
    const markersByMetric = {};
    (markers || []).forEach(m => { (markersByMetric[m.metric_id] ||= []).push(m); });

    const scoreMetrics = (metrics || []).filter(m => m.client_group === "body_system");
    const habitMetrics = (metrics || []).filter(m => m.client_group === "habit_mirror");

    const groupsByKey = {};
    scoreMetrics.forEach(m => {
      const result = resultsByMetric[m.id];
      if (!result) return;
      const key = THEME_GROUP[m.theme_id] || "other";
      (groupsByKey[key] ||= []).push({ metric: m, result, markers: markersByMetric[m.id] || [] });
    });
    const scoreGroups = Object.entries(groupsByKey).map(([key, items]) => ({ key, items }));

    const habitScores = habitMetrics.map(m => ({ metric: m, result: resultsByMetric[m.id], markers: markersByMetric[m.id] || [] })).filter(h => h.result);

    const taxaById = Object.fromEntries((taxa || []).map(t => [t.id, t]));
    const profilesByTaxon = Object.fromEntries((profiles || []).map(p => [p.taxon_id, p]));
    const levelByTaxon = Object.fromEntries((levels || []).map(l => [l.taxon_id, l.level]));
    const keyBacteria = (keyBact || [])
      .map(k => ({
        ...k, name: k.portal_name || taxaById[k.taxon_id]?.name || k.taxon_id,
        role: profilesByTaxon[k.taxon_id]?.role, plainEn: profilesByTaxon[k.taxon_id]?.plain_en, plainEs: profilesByTaxon[k.taxon_id]?.plain_es,
        level: levelByTaxon[k.taxon_id],
        gap: Math.abs((k.client_score ?? 0) - (k.community_score ?? 0)),
      }))
      .sort((a, b) => b.gap - a.gap);

    const screenTotal = new Set((screenRows || []).map(r => r.taxon_id)).size;
    const screenDetected = new Set((screenRows || []).filter(r => r.status === "detected").map(r => r.taxon_id)).size;

    setState({
      loading: false, hasReport: true,
      microbiomeAge: profile?.microbiome_age ?? null, ageAtTest: test?.age_at_test ?? null,
      diversityValue: profile?.diversity_value ?? null, wellnessIndex: profile?.wellness_index ?? null,
      scoreGroups, habitScores, keyBacteria, screenTotal, screenDetected,
      reportTexts: Object.fromEntries((texts || []).map(t => [t.key, t])),
    });
  }, [profileId, testId]);

  useEffect(() => { load(); }, [load]);

  return { ...state, refetch: load };
}
