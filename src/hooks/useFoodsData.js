import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

const EMPTY = {
  loading: true, client: null, testId: null,
  foods: [], foodCategories: [], foodScores: [], flagsByFoodId: {}, excludedFoodIds: new Set(), inPlanFoodIds: new Set(),
};

/**
 * Foods screen data (brief 4.4). Builds on the same client/test
 * resolution as useReportV2.js, plus what's specific to this screen:
 * food_review_flags (action='hide' excludes a food outright, other
 * actions show "ask your nutritionist" — brief rule), and
 * client_intolerances (excludes by food id or whole family — the
 * brief: "Foods in the client's food rules never appear").
 *
 * "In my plan" (foods.plan_meal_items) walks the v1 plan hierarchy
 * (plan_phases -> plan_days -> plan_meals -> plan_meal_items) via
 * profileId, since Phase S attached the v4 plan_meal_items table onto
 * the existing v1 plan_meals rather than a new table — so this lights
 * up correctly once a client's plan is populated with meal items,
 * with no extra migration needed.
 */
export function useFoodsData(userId, profileId) {
  const [state, setState] = useState(EMPTY);

  const load = useCallback(async () => {
    if (!userId) { setState({ ...EMPTY, loading: false }); return; }
    setState(s => ({ ...s, loading: true }));

    const [{ data: foods }, { data: foodCategories }] = await Promise.all([
      supabase.from("foods").select("id,name_en,name_es,category_id,image_url,family"),
      supabase.from("food_categories").select("*").order("sort_order"),
    ]);

    const { data: clientRow } = await supabase.from("clients").select("id").eq("auth_user_id", userId).maybeSingle();
    if (!clientRow) { setState({ ...EMPTY, loading: false, foods: foods || [], foodCategories: foodCategories || [] }); return; }

    const { data: testRow } = await supabase.from("tests").select("id").eq("client_id", clientRow.id).order("test_number", { ascending: false }).limit(1).maybeSingle();
    const testId = testRow?.id || null;

    const [{ data: foodScores }, { data: flags }, { data: intolerances }] = await Promise.all([
      testId ? supabase.from("food_scores").select("*").eq("test_id", testId) : Promise.resolve({ data: [] }),
      testId ? supabase.from("food_review_flags").select("*").eq("test_id", testId) : Promise.resolve({ data: [] }),
      supabase.from("client_intolerances").select("food_id,family").eq("client_id", clientRow.id),
    ]);

    // "In my plan": walk plan_phases -> plan_days -> plan_meals -> plan_meal_items for this client's v1 profile.
    let inPlanFoodIds = new Set();
    if (profileId) {
      const { data: phases } = await supabase.from("plan_phases").select("id").eq("profile_id", profileId);
      const phaseIds = (phases || []).map(p => p.id);
      if (phaseIds.length) {
        const { data: days } = await supabase.from("plan_days").select("id").in("phase_id", phaseIds);
        const dayIds = (days || []).map(d => d.id);
        if (dayIds.length) {
          const { data: meals } = await supabase.from("plan_meals").select("id").in("day_id", dayIds);
          const mealIds = (meals || []).map(m => m.id);
          if (mealIds.length) {
            const { data: items } = await supabase.from("plan_meal_items").select("food_id").in("meal_id", mealIds);
            inPlanFoodIds = new Set((items || []).map(i => i.food_id));
          }
        }
      }
    }

    const foodsByFamily = {};
    (foods || []).forEach(f => { if (f.family) (foodsByFamily[f.family] ||= []).push(f.id); });

    const excludedFoodIds = new Set();
    (flags || []).forEach(f => { if (f.action === "hide") excludedFoodIds.add(f.food_id); });
    (intolerances || []).forEach(i => {
      if (i.food_id) excludedFoodIds.add(i.food_id);
      if (i.family) (foodsByFamily[i.family] || []).forEach(id => excludedFoodIds.add(id));
    });

    const flagsByFoodId = Object.fromEntries((flags || []).filter(f => f.action !== "hide").map(f => [f.food_id, f]));

    setState({
      loading: false, client: clientRow, testId,
      foods: foods || [], foodCategories: foodCategories || [], foodScores: foodScores || [],
      flagsByFoodId, excludedFoodIds, inPlanFoodIds,
    });
  }, [userId, profileId]);

  useEffect(() => { load(); }, [load]);

  return { ...state, refetch: load };
}
