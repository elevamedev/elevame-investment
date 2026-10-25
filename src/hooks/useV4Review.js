import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

/**
 * Staff-only review data for the v4 redesign's gated content (brief
 * section 4.13). Four tables (body_system_status, body_system_signals,
 * body_system_levers, report_texts) are scoped to one test and carry
 * separate English/Spanish approval (reviewed_at/reviewed_by and
 * reviewed_es_at) — the database clears approval on edit by itself
 * (the reset_review trigger, supabase/migrations/20261024000002_
 * privacy_integrity.sql), so this hook never has to.
 *
 * body_system_education (science text) and swap_pairs are catalogue
 * wide, not per test — body_system_education is reviewed once per
 * theme (a single reviewed_at, no English/Spanish split), swap_pairs
 * once per pair (a single approved flag). Both still show on every
 * test's review screen per the brief, since there's one review pass
 * for this small, shared content, not one per client.
 */
export function useV4Review(testId) {
  const [state, setState] = useState({
    statuses: [], signals: [], levers: [], reportTexts: [], education: [], swapPairs: [], detectedOrganisms: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!testId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [
        { data: statuses, error: e1 },
        { data: signals, error: e2 },
        { data: levers, error: e3 },
        { data: reportTexts, error: e4 },
        { data: education, error: e5 },
        { data: swapPairs, error: e6 },
        { data: detected, error: e7 },
      ] = await Promise.all([
        supabase.from("body_system_status").select("*, themes(name_en)").eq("test_id", testId).order("theme_id"),
        supabase.from("body_system_signals").select("*, signal_taxa(*, taxa(name))").eq("test_id", testId).order("theme_id").order("sort_order"),
        supabase.from("body_system_levers").select("*, body_system_lever_foods(*, foods(name_en))").eq("test_id", testId).order("theme_id").order("sort_order"),
        supabase.from("report_texts").select("*").eq("test_id", testId).order("key"),
        supabase.from("body_system_education").select("*, education_facts(*)").order("theme_id"),
        supabase.from("swap_pairs").select("*, from_food:foods!swap_pairs_from_food_id_fkey(name_en), to_food:foods!swap_pairs_to_food_id_fkey(name_en)"),
        supabase.from("screen_results").select("taxon_id, taxa(name)").eq("test_id", testId).eq("status", "detected"),
      ]);
      const err = e1 || e2 || e3 || e4 || e5 || e6 || e7;
      if (err) throw err;
      setState({
        statuses: statuses || [], signals: signals || [], levers: levers || [], reportTexts: reportTexts || [],
        education: education || [], swapPairs: swapPairs || [],
        detectedOrganisms: (detected || []).map(d => d.taxa?.name || d.taxon_id),
      });
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => { load(); }, [load]);

  async function patch(table, match, fields) {
    let q = supabase.from(table).update(fields);
    for (const [col, val] of Object.entries(match)) q = q.eq(col, val);
    const { error } = await q;
    if (!error) await load(); // reviewed_at/_es_at may have been cleared by the reset_review trigger too — simplest to reload
    return { error };
  }

  function approveEn(table, match, userId) { return patch(table, match, { reviewed_at: new Date().toISOString(), reviewed_by: userId }); }
  function approveEs(table, match) { return patch(table, match, { reviewed_es_at: new Date().toISOString() }); }
  function unapproveEn(table, match) { return patch(table, match, { reviewed_at: null, reviewed_by: null }); }
  function unapproveEs(table, match) { return patch(table, match, { reviewed_es_at: null }); }
  function updateText(table, match, field, value) { return patch(table, match, { [field]: value }); }

  function approveEducation(themeId) { return patch("body_system_education", { theme_id: themeId }, { reviewed_at: new Date().toISOString() }); }
  function unapproveEducation(themeId) { return patch("body_system_education", { theme_id: themeId }, { reviewed_at: null }); }

  function approveSwapPair(fromFoodId, toFoodId, userId) {
    return patch("swap_pairs", { from_food_id: fromFoodId, to_food_id: toFoodId }, { approved: true, approved_by: userId });
  }
  function unapproveSwapPair(fromFoodId, toFoodId) {
    return patch("swap_pairs", { from_food_id: fromFoodId, to_food_id: toFoodId }, { approved: false, approved_by: null });
  }

  async function approveAllForTest(userId) {
    const now = new Date().toISOString();
    const [r1, r2, r3, r4] = await Promise.all([
      supabase.from("body_system_status").update({ reviewed_at: now, reviewed_by: userId }).eq("test_id", testId),
      supabase.from("body_system_signals").update({ reviewed_at: now, reviewed_by: userId }).eq("test_id", testId),
      supabase.from("body_system_levers").update({ reviewed_at: now, reviewed_by: userId }).eq("test_id", testId),
      supabase.from("report_texts").update({ reviewed_at: now, reviewed_by: userId }).eq("test_id", testId),
    ]);
    const error = r1.error || r2.error || r3.error || r4.error;
    if (!error) await load();
    return { error };
  }

  return {
    ...state, loading, error, refetch: load,
    approveEn, approveEs, unapproveEn, unapproveEs, updateText,
    approveEducation, unapproveEducation, approveSwapPair, unapproveSwapPair,
    approveAllForTest,
  };
}
