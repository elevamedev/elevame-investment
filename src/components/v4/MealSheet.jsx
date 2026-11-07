import { useState } from "react";
import { Heart } from "lucide-react";
import { C } from "../../theme.js";
import ScoreBadge, { bandFor } from "./ScoreBadge.jsx";
import { useToast } from "../../context/ToastContext.jsx";

/**
 * Swap suggestions for a plan food (brief 4.3): same category, higher
 * score, never mutton/goat, never flagged, never Reduce-band even if
 * nominally higher-scoring, never excluded by the client's food rules.
 * The mockup's own `swapsFor` only checks the first three of these.
 */
export function swapOptionsFor(food, foods, scoreByFoodId, excludedFoodIds, flagsByFoodId) {
  const score = scoreByFoodId[food.id];
  if (score == null) return [];
  return foods
    .filter(f => f.id !== food.id && f.category_id === food.category_id && !excludedFoodIds.has(f.id) && !flagsByFoodId[f.id]
      && !/mutton|goat/i.test(f.id) && scoreByFoodId[f.id] != null && scoreByFoodId[f.id] > score && bandFor(scoreByFoodId[f.id]) !== "reduce")
    .sort((a, b) => scoreByFoodId[b.id] - scoreByFoodId[a.id])
    .slice(0, 3);
}

/**
 * Shared meal sheet body (brief 4.3's meal sheet), used both by the
 * Plan screen and Home's "See meal" so swap/log/keeper behaviour stays
 * identical in both places.
 */
export default function MealSheetContent({ meal, items, foodsById, scoreByFoodId, flagsByFoodId, excludedFoodIds, foods, plan, t, lang }) {
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
