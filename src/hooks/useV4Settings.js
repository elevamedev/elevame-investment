import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

const EMPTY = {
  loading: true,
  clientId: null,
  settings: null,
  weightGoal: null,
  portionsVisible: false,
  foodRules: [],
  nutritionist: null,
};

/**
 * Settings screen data (brief 4.11): client_settings plus the few
 * other tables its rows read from or write to — weight_goals (the
 * portions request), client_intolerances (the read only food rules
 * sheet), and the client's assigned clinician's contact info.
 */
export function useV4Settings(userId) {
  const [state, setState] = useState(EMPTY);

  const load = useCallback(async () => {
    if (!userId) { setState({ ...EMPTY, loading: false }); return; }
    setState(s => ({ ...s, loading: true }));

    const { data: clientRow } = await supabase.from("clients").select("id").eq("auth_user_id", userId).maybeSingle();
    if (!clientRow) { setState({ ...EMPTY, loading: false }); return; }
    const clientId = clientRow.id;

    const [
      { data: settings },
      { data: weightGoal },
      { data: intolerances },
      { data: nutritionistRows },
    ] = await Promise.all([
      supabase.from("client_settings").select("*").eq("client_id", clientId).maybeSingle(),
      supabase.from("weight_goals").select("show_portions,screening_ok,approved_at,blocked_reason").eq("client_id", clientId).maybeSingle(),
      supabase.from("client_intolerances").select("food_id,family,reason,note").eq("client_id", clientId),
      supabase.rpc("my_nutritionist_contact"),
    ]);

    let foodRules = intolerances || [];
    const foodIds = foodRules.map(r => r.food_id).filter(Boolean);
    if (foodIds.length) {
      const { data: foods } = await supabase.from("foods").select("id,name_en,name_es").in("id", foodIds);
      const byId = Object.fromEntries((foods || []).map(f => [f.id, f]));
      foodRules = foodRules.map(r => ({ ...r, food: r.food_id ? byId[r.food_id] : null }));
    }

    let portionsVisible = false;
    if (weightGoal) {
      const { data } = await supabase.rpc("portions_visible", { p_client_id: clientId });
      portionsVisible = !!data;
    }

    setState({
      loading: false,
      clientId,
      settings,
      weightGoal: weightGoal || null,
      portionsVisible,
      foodRules,
      nutritionist: nutritionistRows?.[0] || null,
    });
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function updateSettings(patch) {
    if (!state.clientId) return;
    // text_size takes effect immediately (index.css scales off this
    // attribute); theme is reactive through ThemeContext already —
    // useV4ThemeSync only re-applies both once, on load.
    if (patch.text_size) document.documentElement.dataset.textSize = patch.text_size;
    setState(s => ({ ...s, settings: { ...s.settings, ...patch } }));
    const { error } = await supabase.from("client_settings").update(patch).eq("client_id", state.clientId);
    if (error) await load();
  }

  async function requestPortions(show) {
    if (!state.clientId) return;
    setState(s => ({ ...s, weightGoal: s.weightGoal ? { ...s.weightGoal, show_portions: show } : s.weightGoal }));
    await supabase.from("weight_goals").update({ show_portions: show }).eq("client_id", state.clientId);
    await load();
  }

  async function exportMyData() {
    const { data, error } = await supabase.rpc("export_my_data");
    if (error) throw error;
    return data;
  }

  return { ...state, refetch: load, updateSettings, requestPortions, exportMyData };
}
