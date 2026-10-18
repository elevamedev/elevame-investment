import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

/**
 * Staff-only data access for the admin review panel. Every table
 * queried here is RLS-gated to is_staff()/is_admin() (see
 * supabase/schema_v2_data_model.sql + schema_v2_admin.sql) — a
 * non-staff signed-in user gets an empty `staffRole` and this hook
 * stops there, so there's no separate "am I allowed" check needed
 * beyond reading `staffRole`.
 */
export function useStaffRole(userId) {
  const [role, setRole] = useState(undefined); // undefined = not yet checked, null = not staff
  useEffect(() => {
    if (!userId) { setRole(null); return; }
    let cancelled = false;
    supabase.from("staff").select("role").eq("user_id", userId).maybeSingle().then(({ data }) => {
      if (!cancelled) setRole(data?.role ?? null);
    });
    return () => { cancelled = true; };
  }, [userId]);
  return role;
}

export function useAdminTestList() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: testRows, error: testsErr } = await supabase
        .from("tests").select("*, clients(id,name), kits(kit_code)")
        .order("created_at", { ascending: false });
      if (testsErr) throw testsErr;

      const testIds = (testRows || []).map(t => t.id);
      const { data: issueRows, error: issuesErr } = testIds.length
        ? await supabase.from("data_quality_issues").select("test_id, resolved").in("test_id", testIds)
        : { data: [], error: null };
      if (issuesErr) throw issuesErr;

      const openCountByTest = {};
      (issueRows || []).forEach(i => { if (!i.resolved) openCountByTest[i.test_id] = (openCountByTest[i.test_id] || 0) + 1; });

      setTests((testRows || []).map(t => ({ ...t, openIssueCount: openCountByTest[t.id] || 0 })));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { tests, loading, error, refetch: load };
}

export function useAdminTestReview(testId) {
  const [state, setState] = useState({ issues: [], insights: [], flags: [], conditionResults: [], themes: [], conditions: [], foods: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!testId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [
        { data: issues, error: e1 },
        { data: insights, error: e2 },
        { data: flags, error: e3 },
        { data: conditionResults, error: e4 },
        { data: themes, error: e5 },
        { data: conditions, error: e6 },
        { data: foods, error: e7 },
      ] = await Promise.all([
        supabase.from("data_quality_issues").select("*").eq("test_id", testId).order("created_at"),
        supabase.from("insights").select("*").eq("test_id", testId).order("created_at"),
        supabase.from("food_review_flags").select("*").eq("test_id", testId),
        supabase.from("condition_results").select("*, conditions(name_en,theme_id)").eq("test_id", testId).eq("at_risk", true),
        supabase.from("themes").select("id,name_en").order("sort_order"),
        supabase.from("conditions").select("id,name_en,theme_id"),
        supabase.from("foods").select("id,name_en").order("name_en"),
      ]);
      const err = e1 || e2 || e3 || e4 || e5 || e6 || e7;
      if (err) throw err;
      setState({ issues: issues || [], insights: insights || [], flags: flags || [], conditionResults: conditionResults || [], themes: themes || [], conditions: conditions || [], foods: foods || [] });
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => { load(); }, [load]);

  async function setIssueResolved(issueId, resolved) {
    const { error } = await supabase.from("data_quality_issues").update({ resolved }).eq("id", issueId);
    if (!error) setState(s => ({ ...s, issues: s.issues.map(i => i.id === issueId ? { ...i, resolved } : i) }));
    return { error };
  }

  async function addInsight(row) {
    const { data, error } = await supabase.from("insights").insert({ test_id: testId, author: "nutritionist", ...row }).select().single();
    if (!error) setState(s => ({ ...s, insights: [...s.insights, data] }));
    return { error };
  }

  async function setInsightApproved(insightId, approved) {
    const { error } = await supabase.from("insights").update({ approved }).eq("id", insightId);
    if (!error) setState(s => ({ ...s, insights: s.insights.map(i => i.id === insightId ? { ...i, approved } : i) }));
    return { error };
  }

  async function addFlag(row) {
    const { data, error } = await supabase.from("food_review_flags").upsert({ test_id: testId, ...row }, { onConflict: "test_id,food_id" }).select().single();
    if (!error) setState(s => ({ ...s, flags: [...s.flags.filter(f => f.food_id !== row.food_id), data] }));
    return { error };
  }

  async function removeFlag(foodId) {
    const { error } = await supabase.from("food_review_flags").delete().eq("test_id", testId).eq("food_id", foodId);
    if (!error) setState(s => ({ ...s, flags: s.flags.filter(f => f.food_id !== foodId) }));
    return { error };
  }

  async function publish() {
    const { error } = await supabase.from("tests").update({ published_at: new Date().toISOString() }).eq("id", testId);
    return { error };
  }

  async function unpublish() {
    const { error } = await supabase.from("tests").update({ published_at: null }).eq("id", testId);
    return { error };
  }

  return { ...state, loading, error, refetch: load, setIssueResolved, addInsight, setInsightApproved, addFlag, removeFlag, publish, unpublish };
}
