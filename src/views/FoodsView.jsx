import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useC } from "../theme.js";
import { V4_LIGHT } from "../theme4.js";
import { useFoodsData } from "../hooks/useFoodsData.js";
import ScoreBadge, { bandFor, bandLabel } from "../components/v4/ScoreBadge.jsx";
import Sheet from "../components/v4/Sheet.jsx";
import { useSheetParam } from "../hooks/useSheetParam.js";
import { supabase } from "../lib/supabaseClient.js";

const COPY = {
  en: {
    searchPlaceholder: "Search foods", clearSearch: "Clear search",
    all: "All", inPlan: "In my plan",
    bandMeaning: {
      enrich: "Foods that work in your favour, based on your own gut results.",
      include: "Everyday foods — fine as part of a varied diet.",
      reduce: "Best left out during your 6 weeks.",
    },
    askNutritionist: "Ask your nutritionist",
    emptyWithOther: (q, other) => `No ${other} food matches "${q}", but other bands have some. Tap that tab above.`,
    emptySimple: "Try another name, or check the spelling.",
    loading: "Loading…", noReport: "Your results appear here once your nutritionist has reviewed your report.",
    sheetBand: "Band", sheetScore: "Score", sheetInPlan: "In your plan", sheetSwaps: "Swap ideas",
    sheetNotInPlan: "Not currently in your plan.",
  },
  es: {
    searchPlaceholder: "Buscar alimentos", clearSearch: "Borrar búsqueda",
    all: "Todos", inPlan: "En mi plan",
    bandMeaning: {
      enrich: "Alimentos que juegan a tu favor, según tus propios resultados.",
      include: "Alimentos de cada día: bien como parte de una dieta variada.",
      reduce: "Mejor dejarlos fuera durante tus 6 semanas.",
    },
    askNutritionist: "Pregunta a tu nutricionista",
    emptyWithOther: (q, other) => `Ningún alimento de ${other} coincide con "${q}", pero otras bandas sí tienen. Toca esa pestaña arriba.`,
    emptySimple: "Prueba otro nombre o revisa la ortografía.",
    loading: "Cargando…", noReport: "Tus resultados aparecerán aquí cuando tu nutricionista haya revisado tu informe.",
    sheetBand: "Banda", sheetScore: "Puntuación", sheetInPlan: "En tu plan", sheetSwaps: "Ideas de sustitución",
    sheetNotInPlan: "No está actualmente en tu plan.",
  },
};

const BAND_ORDER = ["enrich", "include", "reduce"];

function FoodSheetContent({ food, score, lang, t, inPlan }) {
  const C = useC();
  const band = bandFor(score);
  const [swaps, setSwaps] = useState([]);

  useEffect(() => {
    let cancelled = false;
    supabase.from("swap_pairs").select("to_food_id, foods!swap_pairs_to_food_id_fkey(name_en,name_es)")
      .eq("from_food_id", food.id).eq("approved", true)
      .then(({ data }) => { if (!cancelled) setSwaps(data || []); });
    return () => { cancelled = true; };
  }, [food.id]);

  return (
    <div>
      <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 20, margin: "4px 0 10px", color: C.navy }}>
        {lang === "es" ? (food.name_es || food.name_en) : food.name_en}
      </h2>
      <div className="mb-3"><ScoreBadge score={score} /></div>
      <div className="text-sm mb-4" style={{ color: C.textSoft }}>{t.bandMeaning[band]}</div>
      <div className="text-xs font-semibold mb-1" style={{ color: C.navy }}>{t.sheetInPlan}</div>
      <div className="text-sm mb-4" style={{ color: C.textSoft }}>{inPlan ? "✓" : t.sheetNotInPlan}</div>
      {swaps.length > 0 && (
        <>
          <div className="text-xs font-semibold mb-1.5" style={{ color: C.navy }}>{t.sheetSwaps}</div>
          <div className="flex flex-wrap gap-2">
            {swaps.map(s => (
              <span key={s.to_food_id} className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: C.bg, color: C.text }}>
                {lang === "es" ? (s.foods?.name_es || s.foods?.name_en) : s.foods?.name_en}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function FoodsView({ lang, user, profileId }) {
  const t = COPY[lang] || COPY.en;
  const C = useC();
  const data = useFoodsData(user?.id, profileId);
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("enrich");
  const [cat, setCat] = useState("all");
  const { isOpen, open, close } = useSheetParam();

  const visibleScores = useMemo(
    () => data.foodScores.filter(fs => !data.excludedFoodIds.has(fs.food_id)),
    [data.foodScores, data.excludedFoodIds]
  );

  const counts = useMemo(() => {
    const c = { enrich: 0, include: 0, reduce: 0 };
    visibleScores.forEach(fs => { c[bandFor(fs.score)]++; });
    return c;
  }, [visibleScores]);

  const foodsById = useMemo(() => Object.fromEntries(data.foods.map(f => [f.id, f])), [data.foods]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = visibleScores
      .filter(fs => bandFor(fs.score) === band)
      .map(fs => ({ ...fs, food: foodsById[fs.food_id] }))
      .filter(r => r.food);
    if (cat === "in_plan") list = list.filter(r => data.inPlanFoodIds.has(r.food_id));
    else if (cat !== "all") list = list.filter(r => r.food.category_id === cat);
    if (q) list = list.filter(r => (r.food.name_en || "").toLowerCase().includes(q) || (r.food.name_es || "").toLowerCase().includes(q));
    return list.sort((a, b) => b.score - a.score);
  }, [visibleScores, foodsById, band, cat, query, data.inPlanFoodIds]);

  // For the empty-search message: does the same query match something in another band?
  const otherBandWithMatch = useMemo(() => {
    if (!query.trim() || results.length) return null;
    const q = query.trim().toLowerCase();
    for (const b of BAND_ORDER) {
      if (b === band) continue;
      const hit = visibleScores.some(fs => bandFor(fs.score) === b && foodsById[fs.food_id] &&
        ((foodsById[fs.food_id].name_en || "").toLowerCase().includes(q) || (foodsById[fs.food_id].name_es || "").toLowerCase().includes(q)));
      if (hit) return b;
    }
    return null;
  }, [query, results.length, band, visibleScores, foodsById]);

  const openFood = results.find(r => isOpen(`food:${r.food_id}`));

  if (data.loading) return <div className="px-4 pt-8 text-sm text-center" style={{ color: C.textSoft }}>{t.loading}</div>;
  if (!data.testId) return <div className="px-4 pt-8 text-sm text-center" style={{ color: C.textSoft }}>{t.noReport}</div>;

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="rounded-xl flex items-center gap-2 px-3 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <Search size={16} color={C.textSoft} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.searchPlaceholder}
          className="w-full py-3 text-sm outline-none" style={{ color: C.text, background: "transparent" }} />
        {query && <button onClick={() => setQuery("")} aria-label={t.clearSearch} className="p-1.5 -mr-1.5 rounded-full flex-shrink-0"><X size={15} color={C.textSoft} /></button>}
      </div>

      <div className="grid grid-cols-3 gap-1 mb-3 rounded-xl p-1" style={{ background: C.bg }}>
        {BAND_ORDER.map(b => (
          <button key={b} onClick={() => setBand(b)} aria-pressed={band === b}
            className="text-xs font-semibold py-2 rounded-lg text-center"
            style={{ background: band === b ? C.card : "transparent", color: band === b ? C.text : C.textSoft, boxShadow: band === b ? "0 1px 2px rgba(21,23,42,.04)" : "none" }}>
            {bandLabel(b, lang)} <span style={{ color: C.textSoft, fontWeight: 500 }}>{counts[b]}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {[["all", t.all], ["in_plan", t.inPlan], ...data.foodCategories.map(fc => [fc.id, lang === "es" ? fc.name_es : fc.name_en])].map(([id, label]) => (
          <button key={id} onClick={() => setCat(id)} aria-pressed={cat === id} className="px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap"
            style={{ background: cat === id ? C.purple : C.card, color: cat === id ? "#fff" : C.textSoft, border: `1px solid ${cat === id ? C.purple : C.line}` }}>
            {label}
          </button>
        ))}
      </div>

      <div className="text-xs mb-2" style={{ color: C.textSoft }}>{t.bandMeaning[band]}</div>

      {results.length === 0 ? (
        <div className="rounded-xl p-6 text-center text-sm" style={{ border: `1px solid ${C.line}`, color: C.textSoft }}>
          {otherBandWithMatch ? t.emptyWithOther(query, bandLabel(otherBandWithMatch, lang)) : t.emptySimple}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
          {results.map((r, i) => {
            const flag = data.flagsByFoodId[r.food_id];
            return (
              <button key={r.food_id} onClick={() => open(`food:${r.food_id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left" style={{ background: C.card, borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm" style={{ color: C.text }}>{lang === "es" ? (r.food.name_es || r.food.name_en) : r.food.name_en}</div>
                  {flag && <div className="text-[11px] font-medium" style={{ color: V4_LIGHT.inText }}>{t.askNutritionist}</div>}
                </div>
                <ScoreBadge score={r.score} />
              </button>
            );
          })}
        </div>
      )}

      {openFood && (
        <Sheet open={!!openFood} onClose={close} title={lang === "es" ? openFood.food.name_es : openFood.food.name_en}>
          <FoodSheetContent food={openFood.food} score={openFood.score} lang={lang} t={t} inPlan={data.inPlanFoodIds.has(openFood.food_id)} />
        </Sheet>
      )}
    </div>
  );
}
