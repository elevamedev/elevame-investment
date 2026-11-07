import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

function isoDate(d) { return d.toISOString().slice(0, 10); }

function weekStartFor(date) {
  // Weeks start on Friday (brief 4.3): the most recent Friday on or before `date`.
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() - 5 + 7) % 7;
  d.setDate(d.getDate() - diff);
  return isoDate(d);
}

function streakFor(habitId, loggedDays, todayStr) {
  const d = new Date(todayStr + "T00:00:00");
  if (!loggedDays.has(isoDate(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (loggedDays.has(isoDate(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

const EMPTY = {
  loading: true, hasPlan: false, client: null,
  phases: [], phase: null, dayIndex: 0, todayStr: "", weekStart: "",
  meals: [], itemsByMeal: {}, habits: [], habitStreaks: {}, habitDoneToday: {}, habitLogDays: {},
  mealLogs: {}, keeperMealIds: new Set(), swapsByMeal: {}, phaseSwapByFood: {},
  weekFoodIds: [], weekMealCountByFood: {},
};

/**
 * Plan screen data (brief 4.3): today's meals and habits for the
 * client's current phase/day, plus the whole phase's shopping-list
 * ingredients and this week's basket state. Food catalogue, scores,
 * review flags and exclusion rules come from useFoodsData — this hook
 * only covers the plan-specific tables layered on top of it.
 */
export function useV4Plan(profileId, clientId, planDay) {
  const [state, setState] = useState(EMPTY);

  const load = useCallback(async () => {
    if (!profileId || !clientId || !planDay) { setState({ ...EMPTY, loading: false }); return; }

    const { data: phases } = await supabase.from("plan_phases").select("*").eq("profile_id", profileId).order("phase_index");
    if (!phases || !phases.length) { setState({ ...EMPTY, loading: false, hasPlan: false }); return; }

    const phase = [...phases].reverse().find(p => p.start_day <= planDay) || phases[0];
    const dayIndex = ((planDay - phase.start_day) % 7 + 7) % 7;

    const { data: days } = await supabase.from("client_plan_days").select("*").eq("phase_id", phase.id);
    const dayIds = (days || []).map(d => d.id);
    const todayDay = (days || []).find(d => d.day_index === dayIndex);

    const { data: allMeals } = dayIds.length
      ? await supabase.from("plan_meals").select("*").in("day_id", dayIds).order("meal_order")
      : { data: [] };
    const allMealIds = (allMeals || []).map(m => m.id);

    const [{ data: items }, { data: habits }] = await Promise.all([
      allMealIds.length ? supabase.from("plan_meal_items").select("*").in("meal_id", allMealIds).order("sort_order") : Promise.resolve({ data: [] }),
      supabase.from("phase_habits").select("*").eq("phase_id", phase.id).order("sort_order"),
    ]);

    const todayStr = isoDate(new Date());
    const weekStart = weekStartFor(new Date());
    const since = new Date(); since.setDate(since.getDate() - 60);
    const habitIds = (habits || []).map(h => h.id);
    const todayMeals = (allMeals || []).filter(m => m.day_id === todayDay?.id);
    const todayMealIds = todayMeals.map(m => m.id);

    const [{ data: habitLogs }, { data: mealLogs }, { data: keepers }, { data: mealSwaps }, { data: phaseSwaps }, { data: shoppingRows }] = await Promise.all([
      habitIds.length ? supabase.from("habit_logs").select("habit_id,day").eq("client_id", clientId).in("habit_id", habitIds).gte("day", isoDate(since)) : Promise.resolve({ data: [] }),
      todayMealIds.length ? supabase.from("meal_logs").select("meal_id,status").eq("client_id", clientId).eq("day", todayStr).in("meal_id", todayMealIds) : Promise.resolve({ data: [] }),
      todayMealIds.length ? supabase.from("meal_keepers").select("meal_id").eq("client_id", clientId).in("meal_id", todayMealIds) : Promise.resolve({ data: [] }),
      todayMealIds.length ? supabase.from("meal_swaps").select("*").eq("client_id", clientId).eq("scope", "meal").eq("day", todayStr).in("meal_id", todayMealIds) : Promise.resolve({ data: [] }),
      supabase.from("meal_swaps").select("*").eq("client_id", clientId).eq("scope", "phase").eq("phase_id", phase.id),
      supabase.from("shopping_states").select("food_id,state").eq("client_id", clientId).eq("week_start", weekStart),
    ]);

    const itemsByMeal = {};
    (items || []).forEach(it => { (itemsByMeal[it.meal_id] ||= []).push(it); });

    const habitLogDays = {};
    (habitLogs || []).forEach(l => { (habitLogDays[l.habit_id] ||= new Set()).add(l.day); });
    const habitStreaks = {}, habitDoneToday = {};
    (habits || []).forEach(h => {
      const days = habitLogDays[h.id] || new Set();
      habitDoneToday[h.id] = days.has(todayStr);
      habitStreaks[h.id] = streakFor(h.id, days, todayStr);
    });

    const mealLogsByMeal = Object.fromEntries((mealLogs || []).map(l => [l.meal_id, l.status]));
    const keeperMealIds = new Set((keepers || []).map(k => k.meal_id));
    const swapsByMeal = {};
    (mealSwaps || []).forEach(s => { (swapsByMeal[s.meal_id] ||= []).push(s); });
    const phaseSwapByFood = Object.fromEntries((phaseSwaps || []).map(s => [s.from_food_id, s]));

    // Shopping: every food used anywhere in the phase's 7-day rotation,
    // counted by how many meals use it, with phase-wide swaps applied
    // only once they predate this week (brief: "the next list on, never
    // the current one").
    const weekMealCountByFood = {};
    (items || []).forEach(it => {
      const swap = phaseSwapByFood[it.food_id];
      const effectiveId = swap && swap.created_at < weekStart ? swap.to_food_id : it.food_id;
      weekMealCountByFood[effectiveId] = (weekMealCountByFood[effectiveId] || 0) + 1;
    });
    const weekFoodIds = Object.keys(weekMealCountByFood);
    const shoppingStates = Object.fromEntries((shoppingRows || []).map(r => [r.food_id, r.state]));

    setState({
      loading: false, hasPlan: true, client: { id: clientId },
      phases, phase, dayIndex, todayStr, weekStart,
      meals: todayMeals, itemsByMeal, habits: habits || [], habitStreaks, habitDoneToday, habitLogDays,
      mealLogs: mealLogsByMeal, keeperMealIds, swapsByMeal, phaseSwapByFood,
      weekFoodIds, weekMealCountByFood, shoppingStates,
    });
  }, [profileId, clientId, planDay]);

  useEffect(() => { load(); }, [load]);

  async function toggleHabit(habitId) {
    const done = state.habitDoneToday[habitId];
    if (done) await supabase.from("habit_logs").delete().eq("client_id", clientId).eq("habit_id", habitId).eq("day", state.todayStr);
    else await supabase.from("habit_logs").insert({ client_id: clientId, habit_id: habitId, day: state.todayStr });
    await load();
  }

  async function logMealEaten(mealId) {
    await supabase.from("meal_logs").upsert({ client_id: clientId, meal_id: mealId, day: state.todayStr, status: "eaten" });
    await load();
  }

  async function toggleKeeper(mealId) {
    if (state.keeperMealIds.has(mealId)) await supabase.from("meal_keepers").delete().eq("client_id", clientId).eq("meal_id", mealId);
    else await supabase.from("meal_keepers").insert({ client_id: clientId, meal_id: mealId });
    await load();
  }

  async function swapMeal(mealId, fromFoodId, toFoodId, scope) {
    if (scope === "meal") {
      await supabase.from("meal_swaps").delete().eq("client_id", clientId).eq("scope", "meal").eq("meal_id", mealId).eq("day", state.todayStr).eq("from_food_id", fromFoodId);
      await supabase.from("meal_swaps").insert({ client_id: clientId, scope: "meal", meal_id: mealId, day: state.todayStr, from_food_id: fromFoodId, to_food_id: toFoodId });
    } else {
      await supabase.from("meal_swaps").delete().eq("client_id", clientId).eq("scope", "phase").eq("phase_id", state.phase.id).eq("from_food_id", fromFoodId);
      await supabase.from("meal_swaps").insert({ client_id: clientId, scope: "phase", phase_id: state.phase.id, from_food_id: fromFoodId, to_food_id: toFoodId });
    }
    await load();
  }

  async function undoSwap(mealId, fromFoodId, scope) {
    if (scope === "meal") await supabase.from("meal_swaps").delete().eq("client_id", clientId).eq("scope", "meal").eq("meal_id", mealId).eq("day", state.todayStr).eq("from_food_id", fromFoodId);
    else await supabase.from("meal_swaps").delete().eq("client_id", clientId).eq("scope", "phase").eq("phase_id", state.phase.id).eq("from_food_id", fromFoodId);
    await load();
  }

  async function toggleShoppingItem(foodId) {
    if (state.shoppingStates[foodId]) await supabase.from("shopping_states").delete().eq("client_id", clientId).eq("week_start", state.weekStart).eq("food_id", foodId);
    else await supabase.from("shopping_states").insert({ client_id: clientId, week_start: state.weekStart, food_id: foodId, state: "basket" });
    await load();
  }

  return { ...state, toggleHabit, logMealEaten, toggleKeeper, swapMeal, undoSwap, toggleShoppingItem, refetch: load };
}
