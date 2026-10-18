import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { C } from "../theme.js";
import { FOODS, CATEGORY_ORDER } from "../data/foods.js";
import ScorePill from "../components/ScorePill.jsx";
import { useReportV2 } from "../hooks/useReportV2.js";

// Local bilingual copy for the new "Your report" mode only — everything
// FoodsView already used from the shared `t`/`lang` props is untouched.
const COPY = {
  en: {
    modeReport: "Your report", modeCatalog: "General catalog",
    highlightTop: "Your top picks", highlightFit: "Good fits", highlightAvoid: "Best to avoid",
    emptyTitle: "Your personal food scores aren't ready yet",
    emptyBody: "Once your report is processed, every food here will show the score from your own results instead of the general catalog.",
    allCategories: "All",
  },
  es: {
    modeReport: "Tu informe", modeCatalog: "Catálogo general",
    highlightTop: "Tus mejores opciones", highlightFit: "Buenas opciones", highlightAvoid: "Mejor evitar",
    emptyTitle: "Tus puntuaciones personales todavía no están listas",
    emptyBody: "Cuando se procese tu informe, cada alimento aquí mostrará la puntuación de tus propios resultados en lugar del catálogo general.",
    allCategories: "Todas",
  },
};

function HighlightRow({ title, items, lang }) {
  if (!items.length) return null;
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold mb-1.5" style={{ color: C.text }}>{title}</div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map(it => (
          <div key={it.food_id} className="flex-shrink-0 rounded-lg px-2.5 py-2 flex items-center gap-1.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <span className="text-xs whitespace-nowrap" style={{ color: C.text }}>{it.name?.[lang] || it.name?.en}</span>
            <ScorePill score={it.score} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportMode({ t, lang, user }) {
  const copy = COPY[lang] || COPY.en;
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const data = useReportV2(user?.id);

  const hasReport = !data.loading && data.client && data.selectedTestId && data.foodScores.length > 0;

  const categories = useMemo(() => ["all", ...data.foodCategories.map(c => c.id)], [data.foodCategories]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = data.foodScores
      .map(fs => ({ ...fs, food: data.foodsById[fs.food_id] }))
      .filter(r => r.food);
    if (cat !== "all") list = list.filter(r => r.food.category_id === cat);
    if (q) list = list.filter(r => (r.food.name_en || "").toLowerCase().includes(q) || (r.food.name_es || "").toLowerCase().includes(q));
    return list.sort((a, b) => b.score - a.score);
  }, [data.foodScores, data.foodsById, query, cat]);

  const highlightGroups = useMemo(() => {
    const byList = { top: [], fit: [], avoid: [] };
    data.foodHighlights
      .slice()
      .sort((a, b) => a.position - b.position)
      .forEach(h => {
        const food = data.foodsById[h.food_id];
        if (!food || !byList[h.list]) return;
        byList[h.list].push({ food_id: h.food_id, score: data.foodScores.find(fs => fs.food_id === h.food_id)?.score, name: { en: food.name_en, es: food.name_es } });
      });
    return byList;
  }, [data.foodHighlights, data.foodsById, data.foodScores]);

  if (data.loading) {
    return <div className="text-sm px-1 py-6 text-center" style={{ color: C.textSoft }}>{t.loading}</div>;
  }
  if (!hasReport) {
    return (
      <div className="rounded-xl p-6 text-center" style={{ border: `1px solid ${C.line}`, background: C.card }}>
        <div className="text-sm font-semibold mb-1" style={{ color: C.text }}>{copy.emptyTitle}</div>
        <div className="text-xs" style={{ color: C.textSoft }}>{copy.emptyBody}</div>
      </div>
    );
  }

  return (
    <>
      <HighlightRow title={copy.highlightTop} items={highlightGroups.top.slice(0, 6)} lang={lang} />
      <HighlightRow title={copy.highlightFit} items={highlightGroups.fit.slice(0, 6)} lang={lang} />
      <HighlightRow title={copy.highlightAvoid} items={highlightGroups.avoid.slice(0, 6)} lang={lang} />

      <div className="rounded-xl flex items-center gap-2 px-3 mb-3 mt-1" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <Search size={16} color={C.textSoft} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.searchPlaceholder}
          className="w-full py-3 text-sm outline-none" style={{ color: C.text, background: "transparent" }} />
        {query && <button onClick={() => setQuery("")} aria-label={t.clearSearch} className="p-1.5 -mr-1.5 rounded-full flex-shrink-0"><X size={15} color={C.textSoft} /></button>}
      </div>
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {categories.map(c => {
          const fc = data.foodCategories.find(x => x.id === c);
          const label = c === "all" ? copy.allCategories : (fc ? (lang === "es" ? fc.name_es : fc.name_en) : c);
          return (
            <button key={c} onClick={() => setCat(c)} aria-current={cat === c ? "true" : undefined} className="px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap"
              style={{ background: cat === c ? C.navy : "#fff", color: cat === c ? "#fff" : C.textSoft, border: `1px solid ${cat === c ? C.navy : C.line}` }}>
              {label}
            </button>
          );
        })}
      </div>
      <div className="text-xs mb-2" style={{ color: C.textSoft }}>{query ? t.results(results.length) : t.typeToSearch}</div>
      {query && results.length === 0 ? (
        <div className="rounded-xl p-6 text-center text-sm" style={{ border: `1px solid ${C.line}`, color: C.textSoft }}>{t.noFoodsFound}</div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
          {results.slice(0, 60).map((r, i) => (
            <div key={r.food_id} className="flex items-center justify-between px-4 py-3" style={{ background: C.card, borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
              <span className="text-sm" style={{ color: C.text }}>{lang === "es" ? r.food.name_es : r.food.name_en}</span>
              <ScorePill score={r.score} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function CatalogMode({ t, lang }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const categories = ["all", ...CATEGORY_ORDER];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = Object.entries(FOODS).filter(([, f]) => cat === "all" || f.cat === cat);
    if (q) list = list.filter(([, f]) => f[lang].toLowerCase().includes(q));
    return list.sort((a, b) => b[1].score - a[1].score);
  }, [query, cat, lang]);

  return (
    <>
      <div className="rounded-xl flex items-center gap-2 px-3 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <Search size={16} color={C.textSoft} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.searchPlaceholder}
          className="w-full py-3 text-sm outline-none" style={{ color: C.text, background: "transparent" }} />
        {query && <button onClick={() => setQuery("")} aria-label={t.clearSearch} className="p-1.5 -mr-1.5 rounded-full flex-shrink-0"><X size={15} color={C.textSoft} /></button>}
      </div>
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {categories.map(c => (
          <button key={c} onClick={() => setCat(c)} aria-current={cat === c ? "true" : undefined} className="px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap"
            style={{ background: cat === c ? C.navy : "#fff", color: cat === c ? "#fff" : C.textSoft, border: `1px solid ${cat === c ? C.navy : C.line}` }}>
            {c === "all" ? t.all : t.categories[c]}
          </button>
        ))}
      </div>
      <div className="text-xs mb-2" style={{ color: C.textSoft }}>{query ? t.results(results.length) : t.typeToSearch}</div>
      {query && results.length === 0 ? (
        <div className="rounded-xl p-6 text-center text-sm" style={{ border: `1px solid ${C.line}`, color: C.textSoft }}>{t.noFoodsFound}</div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
          {results.slice(0, 60).map(([id, f], i) => (
            <div key={id} className="flex items-center justify-between px-4 py-3" style={{ background: C.card, borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
              <span className="text-sm" style={{ color: C.text }}>{f[lang]}</span>
              <ScorePill score={f.score} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function FoodsView({ t, lang, user }) {
  const copy = COPY[lang] || COPY.en;
  const [mode, setMode] = useState(user ? "report" : "catalog");

  return (
    <div className="px-4 pt-4 pb-24">
      {user && (
        <div className="flex gap-1.5 mb-3">
          {[["report", copy.modeReport], ["catalog", copy.modeCatalog]].map(([key, label]) => (
            <button key={key} onClick={() => setMode(key)} aria-pressed={mode === key} className="flex-1 text-xs font-semibold px-3 py-2 rounded-full"
              style={{ background: mode === key ? C.purple : "#fff", color: mode === key ? "#fff" : C.textSoft, border: `1px solid ${mode === key ? C.purple : C.line}` }}>
              {label}
            </button>
          ))}
        </div>
      )}
      {mode === "report" && user ? <ReportMode t={t} lang={lang} user={user} /> : <CatalogMode t={t} lang={lang} />}
      <div className="mt-4 rounded-xl p-3 text-xs" style={{ background: C.purpleSoft, color: C.navy }}>{t.detectorNote}</div>
    </div>
  );
}
