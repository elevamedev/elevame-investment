import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { C } from "../theme.js";
import { FOODS, CATEGORY_ORDER } from "../data/foods.js";
import ScorePill from "../components/ScorePill.jsx";

export default function FoodsView({ t, lang }) {
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
    <div className="px-4 pt-4 pb-24">
      <div className="rounded-xl flex items-center gap-2 px-3 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <Search size={16} color={C.textSoft} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.searchPlaceholder}
          className="w-full py-3 text-sm outline-none" style={{ color: C.text, background: "transparent" }} />
        {query && <button onClick={() => setQuery("")}><X size={15} color={C.textSoft} /></button>}
      </div>
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {categories.map(c => (
          <button key={c} onClick={() => setCat(c)} className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
            style={{ background: cat === c ? C.navy : "#fff", color: cat === c ? "#fff" : C.textSoft, border: `1px solid ${cat === c ? C.navy : C.line}` }}>
            {c === "all" ? t.all : t.categories[c]}
          </button>
        ))}
      </div>
      <div className="text-xs mb-2" style={{ color: C.textSoft }}>{query ? t.results(results.length) : t.typeToSearch}</div>
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
        {results.slice(0, 60).map(([id, f], i) => (
          <div key={id} className="flex items-center justify-between px-4 py-3" style={{ background: C.card, borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
            <span className="text-sm" style={{ color: C.text }}>{f[lang]}</span>
            <ScorePill score={f.score} />
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl p-3 text-xs" style={{ background: C.purpleSoft, color: C.navy }}>{t.detectorNote}</div>
    </div>
  );
}
