import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Heart } from "lucide-react";
import { C } from "../theme.js";
import { useV4Theme } from "../context/ThemeContext.jsx";
import { useFoodsData } from "../hooks/useFoodsData.js";
import { useV4Plan } from "../hooks/useV4Plan.js";
import ScoreBadge, { bandFor } from "../components/v4/ScoreBadge.jsx";
import Sheet from "../components/v4/Sheet.jsx";
import { useSheetParam } from "../hooks/useSheetParam.js";
import { useToast } from "../context/ToastContext.jsx";

const COPY = {
  en: {
    meals: "Meals", shopping: "Shopping",
    todaysHabits: "Today's habits", resetsEachMorning: "Resets each morning",
    streak: n => `${n} day${n === 1 ? "" : "s"} in a row`, startStreak: "Start a streak today",
    habitsFooter: "Your ticks add up over time and your nutritionist sees them. Streaks, no points.",
    eaten: "Eaten", ateIt: "Ate it", workedForMe: "Worked for me",
    swapFor: "Swap for a higher-scoring food", noHigherSwap: "Nothing in this group scores higher for you.",
    useAlways: "Use this swap every time", swapped: "Swapped", undo: "Undo",
    mealFooter: "Tap a food to see swaps. If a food doesn't agree with you, skip it whatever its score.",
    thisWeek: "This week", inBasket: "in your basket", ofTotal: (n, total) => `${n} of ${total}`,
    allIn: "✓ All in", allDone: "All done", allDoneBody: "Everything for this week is in your basket. Your next list is ready a day before your next plan week starts.",
    openAisleHint: "Open an aisle when you reach it. It closes on its own once everything in it is in your basket.",
    inMeals: n => `in ${n} meal${n === 1 ? "" : "s"}`,
    loading: "Loading…", noPlan: "Your 6-week plan appears here once your nutritionist has set it up.",
    meal: { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" },
    aisle: { fruit_veg: "Fruit and veg", bread_grains: "Bread and grains", legumes: "Legumes", meat_fish: "Meat, fish and eggs", dairy_eggs: "Dairy and eggs", nuts_seeds_oils: "Nuts, seeds and oils", herbs_seasoning: "Herbs and seasoning", other: "Other" },
  },
  es: {
    meals: "Comidas", shopping: "Compra",
    todaysHabits: "Hábitos de hoy", resetsEachMorning: "Se reinicia cada mañana",
    streak: n => `${n} día${n === 1 ? "" : "s"} seguidos`, startStreak: "Empieza una racha hoy",
    habitsFooter: "Tus marcas se acumulan con el tiempo y tu nutricionista las ve. Rachas, sin puntos.",
    eaten: "Comido", ateIt: "Lo comí", workedForMe: "Me funcionó",
    swapFor: "Sustituye por un alimento con mejor puntuación", noHigherSwap: "Nada en este grupo puntúa mejor para ti.",
    useAlways: "Usar esta sustitución siempre", swapped: "Sustituido", undo: "Deshacer",
    mealFooter: "Toca un alimento para ver sustituciones. Si un alimento no te sienta bien, omítelo sea cual sea su puntuación.",
    thisWeek: "Esta semana", inBasket: "en tu cesta", ofTotal: (n, total) => `${n} de ${total}`,
    allIn: "✓ Todo listo", allDone: "Todo listo", allDoneBody: "Ya tienes todo lo de esta semana en tu cesta. Tu próxima lista estará lista un día antes de que empiece tu próxima semana de plan.",
    openAisleHint: "Abre un pasillo cuando llegues a él. Se cierra solo cuando todo lo de dentro está en tu cesta.",
    inMeals: n => `en ${n} comida${n === 1 ? "" : "s"}`,
    loading: "Cargando…", noPlan: "Tu plan de 6 semanas aparecerá aquí cuando tu nutricionista lo haya preparado.",
    meal: { breakfast: "Desayuno", lunch: "Comida", dinner: "Cena", snack: "Merienda" },
    aisle: { fruit_veg: "Fruta y verdura", bread_grains: "Pan y cereales", legumes: "Legumbres", meat_fish: "Carne, pescado y huevos", dairy_eggs: "Lácteos y huevos", nuts_seeds_oils: "Frutos secos, semillas y aceites", herbs_seasoning: "Hierbas y especias", other: "Otros" },
  },
};

const AISLE_ORDER = ["fruit_veg", "bread_grains", "legumes", "meat_fish", "dairy_eggs", "nuts_seeds_oils", "herbs_seasoning", "other"];

function swapOptionsFor(food, foods, scoreByFoodId, excludedFoodIds, flagsByFoodId) {
  const score = scoreByFoodId[food.id];
  if (score == null) return [];
  return foods
    .filter(f => f.id !== food.id && f.category_id === food.category_id && !excludedFoodIds.has(f.id) && !flagsByFoodId[f.id]
      && !/mutton|goat/i.test(f.id) && scoreByFoodId[f.id] != null && scoreByFoodId[f.id] > score && bandFor(scoreByFoodId[f.id]) !== "reduce")
    .sort((a, b) => scoreByFoodId[b.id] - scoreByFoodId[a.id])
    .slice(0, 3);
}

function MealSheetContent({ meal, items, foodsById, scoreByFoodId, flagsByFoodId, excludedFoodIds, foods, plan, t, lang }) {
  const { show } = useToast();
  const [expanded, setExpanded] = useState(null);
  const eaten = plan.mealLogs[meal.id] === "eaten";
  const keeper = plan.keeperMealIds.has(meal.id);

  async function onSwap(fromFoodId, toFood, scope) {
    await plan.swapMeal(meal.id, fromFoodId, toFood.id, scope);
    show(t.swapped + ": " + (lang === "es" ? toFood.name_es : toFood.name_en), "success");
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 20, margin: "4px 0 14px", color: C.navy }}>
        {lang === "es" ? (meal.dish_es || meal.dish_en) : meal.dish_en}
      </h2>
      <div className="rounded-xl overflow-hidden mb-3" style={{ border: `1px solid ${C.line}` }}>
        {items.map((it, i) => {
          const food = foodsById[it.food_id];
          if (!food) return null;
          const mealSwap = plan.swapsByMeal[meal.id]?.find(s => s.from_food_id === it.food_id);
          const phaseSwap = plan.phaseSwapByFood[it.food_id];
          const activeSwap = mealSwap || phaseSwap;
          const activeScope = mealSwap ? "meal" : phaseSwap ? "phase" : null;
          const effectiveFood = activeSwap ? foodsById[activeSwap.to_food_id] : food;
          const score = scoreByFoodId[effectiveFood?.id];
          const alts = swapOptionsFor(food, foods, scoreByFoodId, excludedFoodIds, flagsByFoodId);
          const isOpen = expanded === it.food_id;
          return (
            <div key={it.food_id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
              <button onClick={() => setExpanded(isOpen ? null : it.food_id)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                <div className="flex-1 min-w-0">
                  <div className="text-sm" style={{ color: C.text }}>{lang === "es" ? (effectiveFood?.name_es || effectiveFood?.name_en) : effectiveFood?.name_en}</div>
                  {activeSwap && <div className="text-[11px] font-medium" style={{ color: C.purple }}>{t.swapped}</div>}
                </div>
                {score != null && <ScoreBadge score={score} />}
              </button>
              {isOpen && (
                <div className="px-4 pb-3 text-sm" style={{ color: C.textSoft }}>
                  {flagsByFoodId[it.food_id] && <div className="mb-2 text-xs font-medium" style={{ color: C.amberText }}>Ask your nutritionist how often this fits your plan.</div>}
                  {alts.length ? (
                    <>
                      <div className="text-xs mb-1.5">{t.swapFor}</div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {alts.map(a => (
                          <button key={a.id} onClick={() => onSwap(it.food_id, a, "meal")} className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: C.bg, color: C.text, border: `1px solid ${C.line}` }}>
                            {(lang === "es" ? a.name_es : a.name_en)} ({scoreByFoodId[a.id]})
                          </button>
                        ))}
                      </div>
                      {activeSwap ? (
                        <button onClick={() => plan.undoSwap(meal.id, it.food_id, activeScope)} className="text-xs font-semibold" style={{ color: C.purple }}>{t.undo}</button>
                      ) : (
                        <button onClick={() => onSwap(it.food_id, alts[0], "phase")} className="text-xs font-semibold" style={{ color: C.purple }}>{t.useAlways}</button>
                      )}
                    </>
                  ) : <div className="text-xs">{t.noHigherSwap}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mb-3">
        <button onClick={() => plan.logMealEaten(meal.id)} disabled={eaten}
          className="flex-1 text-sm font-semibold py-2.5 rounded-xl" style={{ background: eaten ? C.purpleSoft : C.purple, color: eaten ? C.purple : "#fff" }}>
          {eaten ? `✓ ${t.eaten}` : t.ateIt}
        </button>
        <button onClick={() => plan.toggleKeeper(meal.id)} aria-pressed={keeper}
          className="px-3.5 rounded-xl flex items-center gap-1.5 text-sm font-medium" style={{ border: `1px solid ${C.line}`, color: keeper ? C.red : C.textSoft }}>
          <Heart size={15} fill={keeper ? C.red : "none"} /> {t.workedForMe}
        </button>
      </div>
      <p className="text-xs" style={{ color: C.textSoft }}>{t.mealFooter}</p>
    </div>
  );
}

export default function PlanView({ lang, user, profile }) {
  const t = COPY[lang] || COPY.en;
  const { V } = useV4Theme();
  const location = useLocation();
  const [tab, setTab] = useState(location.pathname.endsWith("/shopping") ? "shopping" : "meals");
  const [openAisles, setOpenAisles] = useState({});
  const { isOpen, open, close } = useSheetParam();

  const planDay = useMemo(() => {
    const start = new Date(profile?.plan_start_date || new Date().toISOString().slice(0, 10)); start.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.min(Math.max(Math.floor((today - start) / 86400000), 0), 41) + 1;
  }, [profile?.plan_start_date]);

  const foodsData = useFoodsData(user?.id, profile?.id);
  const plan = useV4Plan(profile?.id, foodsData.client?.id, planDay);

  const foodsById = useMemo(() => Object.fromEntries(foodsData.foods.map(f => [f.id, f])), [foodsData.foods]);
  const categoriesById = useMemo(() => Object.fromEntries(foodsData.foodCategories.map(c => [c.id, c])), [foodsData.foodCategories]);
  const scoreByFoodId = useMemo(() => Object.fromEntries(foodsData.foodScores.map(s => [s.food_id, s.score])), [foodsData.foodScores]);

  const aisles = useMemo(() => {
    const groups = {};
    plan.weekFoodIds.forEach(id => {
      const food = foodsById[id];
      if (!food) return;
      const group = food.shop_group_override || categoriesById[food.category_id]?.shopping_list_group || "other";
      (groups[group] ||= []).push(id);
    });
    return AISLE_ORDER.filter(a => groups[a]?.length).map(a => ({
      key: a, ids: groups[a].sort((x, y) => (foodsById[x]?.name_en || "").localeCompare(foodsById[y]?.name_en || "")),
    }));
  }, [plan.weekFoodIds, foodsById, categoriesById]);

  const basketCount = plan.weekFoodIds.filter(id => plan.shoppingStates[id]).length;
  const totalCount = plan.weekFoodIds.length;

  // An aisle closes itself the moment its last item is ticked (brief:
  // "it closes on its own once everything in it is in your basket").
  // After that it's a normal toggle, so tapping a done aisle reopens it
  // (an explicit brief override — the mockup this is built from can't).
  const prevDoneRef = useRef({});
  useEffect(() => {
    aisles.forEach(a => {
      const done = a.ids.length > 0 && a.ids.every(id => plan.shoppingStates[id]);
      if (done && !prevDoneRef.current[a.key]) setOpenAisles(s => ({ ...s, [a.key]: false }));
      prevDoneRef.current[a.key] = done;
    });
  }, [aisles, plan.shoppingStates]);

  const openMeal = plan.meals.find(m => isOpen(`meal:${m.id}`));

  if (foodsData.loading || plan.loading) return <div className="px-4 pt-8 text-sm text-center" style={{ color: C.textSoft }}>{t.loading}</div>;
  if (!plan.hasPlan) return <div className="px-4 pt-8 text-sm text-center" style={{ color: C.textSoft }}>{t.noPlan}</div>;

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="grid grid-cols-2 gap-1 mb-4 rounded-xl p-1" style={{ background: C.bg }}>
        {["meals", "shopping"].map(key => (
          <button key={key} onClick={() => setTab(key)} aria-pressed={tab === key}
            className="text-xs font-semibold py-2 rounded-lg text-center"
            style={{ background: tab === key ? C.card : "transparent", color: tab === key ? C.text : C.textSoft }}>
            {t[key]}
          </button>
        ))}
      </div>

      {tab === "meals" ? (
        <>
          <div className="rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${C.line}` }}>
            {plan.meals.map((m, i) => {
              const items = plan.itemsByMeal[m.id] || [];
              const eaten = plan.mealLogs[m.id] === "eaten";
              const names = items.map(it => foodsById[it.food_id]).filter(Boolean).map(f => (lang === "es" ? f.name_es : f.name_en)).join(" · ");
              return (
                <button key={m.id} onClick={() => open(`meal:${m.id}`)} className="w-full text-left px-4 py-3" style={{ background: C.card, borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold uppercase" style={{ color: C.textSoft }}>{t.meal[m.label_key] || m.label_key}</span>
                    {eaten && <span className="text-[11px] font-semibold" style={{ color: V.good }}>✓ {t.eaten}</span>}
                  </div>
                  <div className="text-sm font-semibold mb-2" style={{ color: C.text }}>{lang === "es" ? (m.dish_es || m.dish_en) : m.dish_en}</div>
                  <div aria-hidden="true" className="flex gap-0.5 mb-2" style={{ height: 6, borderRadius: 3, overflow: "hidden" }}>
                    {items.map(it => {
                      const score = scoreByFoodId[it.food_id];
                      const band = score != null ? bandFor(score) : null;
                      const color = band === "enrich" ? V.en : band === "include" ? V.in : band === "reduce" ? V.re : C.line;
                      return <i key={it.food_id} style={{ flex: 1, background: color }} />;
                    })}
                  </div>
                  <div className="text-xs" style={{ color: C.textSoft }}>{names}</div>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-semibold mb-1 flex items-center justify-between" style={{ color: C.navy }}>
            <span>{t.todaysHabits}</span><span className="font-normal" style={{ color: C.textSoft }}>{t.resetsEachMorning}</span>
          </div>
          <div className="rounded-xl overflow-hidden mb-2" style={{ border: `1px solid ${C.line}` }}>
            {plan.habits.map((h, i) => {
              const on = plan.habitDoneToday[h.id];
              const n = plan.habitStreaks[h.id];
              return (
                <button key={h.id} onClick={() => plan.toggleHabit(h.id)} aria-pressed={on}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left" style={{ background: C.card, borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                  <span className="flex-none rounded-lg" style={{ width: 26, height: 26, display: "grid", placeItems: "center", background: on ? C.purple : "transparent", border: on ? "none" : `1.5px solid ${C.line}`, color: "#fff" }}>{on ? "✓" : ""}</span>
                  <span className="flex-1 min-w-0">
                    <div className="text-sm" style={{ color: C.text }}>{lang === "es" ? h.text_es : h.text_en}</div>
                    <div className="text-xs font-medium" style={{ color: n ? V.good : C.textSoft }}>{n ? t.streak(n) : t.startStreak}</div>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs" style={{ color: C.textSoft }}>{t.habitsFooter}</p>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold" style={{ color: C.navy }}>{t.thisWeek}</span>
            <span className="text-xs" style={{ color: C.textSoft }}>{t.ofTotal(basketCount, totalCount)} {t.inBasket}</span>
          </div>
          {totalCount > 0 && basketCount === totalCount ? (
            <div className="rounded-xl p-4 mb-3" style={{ border: `1px solid ${C.line}`, background: C.card }}>
              <div className="text-sm font-semibold mb-1" style={{ color: C.text }}>{t.allDone}</div>
              <div className="text-xs" style={{ color: C.textSoft }}>{t.allDoneBody}</div>
            </div>
          ) : (
            <p className="text-xs mb-3" style={{ color: C.textSoft }}>{t.openAisleHint}</p>
          )}
          <div className="flex flex-col gap-2.5">
            {aisles.map(a => {
              const n = a.ids.filter(id => plan.shoppingStates[id]).length;
              const done = n === a.ids.length;
              const isOpenAisle = !!openAisles[a.key];
              return (
                <div key={a.key}>
                  <button onClick={() => setOpenAisles(s => ({ ...s, [a.key]: !isOpenAisle }))} aria-expanded={isOpenAisle}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-left" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                    <span className="flex-1 text-sm font-semibold" style={{ color: C.text }}>{t.aisle[a.key]}</span>
                    <span className="text-xs" style={{ color: C.textSoft }}>{done ? t.allIn : t.ofTotal(n, a.ids.length)}</span>
                  </button>
                  {isOpenAisle && (
                    <div className="rounded-xl overflow-hidden mt-1.5" style={{ border: `1px solid ${C.line}` }}>
                      {a.ids.map((id, i) => {
                        const food = foodsById[id];
                        const checked = !!plan.shoppingStates[id];
                        const count = plan.weekMealCountByFood[id];
                        return (
                          <button key={id} onClick={() => plan.toggleShoppingItem(id)} aria-pressed={checked}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left" style={{ background: C.card, borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                            <span className="flex-none rounded-lg" style={{ width: 26, height: 26, display: "grid", placeItems: "center", background: checked ? C.purple : "transparent", border: checked ? "none" : `1.5px solid ${C.line}`, color: "#fff" }}>{checked ? "✓" : ""}</span>
                            <span className="flex-1 text-sm" style={{ color: checked ? C.textSoft : C.text, textDecoration: checked ? "line-through" : "none" }}>{food ? (lang === "es" ? food.name_es : food.name_en) : id}</span>
                            <span className="text-xs" style={{ color: C.textSoft }}>{t.inMeals(count)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {openMeal && (
        <Sheet open={!!openMeal} onClose={close} title={lang === "es" ? openMeal.dish_es : openMeal.dish_en}>
          <MealSheetContent meal={openMeal} items={plan.itemsByMeal[openMeal.id] || []} foodsById={foodsById}
            scoreByFoodId={scoreByFoodId} flagsByFoodId={foodsData.flagsByFoodId} excludedFoodIds={foodsData.excludedFoodIds}
            foods={foodsData.foods} plan={plan} t={t} lang={lang} />
        </Sheet>
      )}
    </div>
  );
}
