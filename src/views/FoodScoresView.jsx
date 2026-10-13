import { useMemo, useState } from "react";
import { Info, ChevronDown } from "lucide-react";
import { C, scoreColor } from "../theme.js";
import { FOODS, CATEGORY_ORDER } from "../data/foods.js";
import FoodImage from "../components/FoodImage.jsx";
import SectionLabel from "../components/SectionLabel.jsx";

// Score bands, same split as the meal plans: 8–10 / 4–7 / 0–3.
const BANDS = [
  { key: "prioritise", min: 8, max: 10, color: C.teal },
  { key: "include", min: 4, max: 7, color: C.amber },
  { key: "reduce", min: 0, max: 3, color: C.red },
];
const bandOf = score => BANDS.find(b => score >= b.min && score <= b.max);

function ScoreBadge({ score }) {
  const c = scoreColor(score);
  return (
    <span className="inline-flex items-center justify-center text-[11px] font-bold rounded-full"
      style={{ minWidth: 26, height: 22, padding: "0 7px", background: c, color: "#fff", boxShadow: `0 2px 6px ${c}55` }}>
      {score}
    </span>
  );
}

function MiniBar({ score }) {
  const c = scoreColor(score);
  return (
    <div className="rounded-full overflow-hidden" style={{ height: 5, background: C.line }}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(score, 0.4) * 10}%`, background: c }} />
    </div>
  );
}

function FoodCard({ id, food, lang }) {
  return (
    <div className="rounded-2xl p-2 pb-3" style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: "0 6px 18px rgba(26,29,46,0.05)" }}>
      <div className="relative" style={{ aspectRatio: "1 / 1" }}>
        <FoodImage id={id} cat={food.cat} size="fill" rounded={14} />
        <div className="absolute top-2 right-2"><ScoreBadge score={food.score} /></div>
      </div>
      <div className="px-1 pt-2">
        <div className="text-[12px] font-semibold leading-tight mb-2" style={{ color: C.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 30 }}>{food[lang]}</div>
        <MiniBar score={food.score} />
      </div>
    </div>
  );
}

export default function FoodScoresView({ t, lang }) {
  const s = t.foodScores;
  const [band, setBand] = useState("prioritise");
  const [cat, setCat] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const PREVIEW = 12;

  const all = useMemo(() => Object.entries(FOODS).sort((a, b) => b[1].score - a[1].score), []);

  const counts = useMemo(() => {
    const out = { prioritise: 0, include: 0, reduce: 0 };
    all.forEach(([, f]) => { out[bandOf(f.score).key] += 1; });
    return out;
  }, [all]);

  const topFoods = useMemo(() => all.filter(([, f]) => f.score >= 9).slice(0, 10), [all]);

  const visible = useMemo(() => {
    const b = BANDS.find(x => x.key === band);
    return all.filter(([, f]) => f.score >= b.min && f.score <= b.max && (cat === "all" || f.cat === cat));
  }, [all, band, cat]);

  const total = all.length;

  return (
    <div className="pb-24">
      {/* Hero: the "plate at a glance", styled like a bright marble counter */}
      <div className="px-4 pt-4">
        <div className="rounded-3xl p-5 relative overflow-hidden" style={{
          background: `
            radial-gradient(60% 50% at 85% 0%, ${C.purpleSoft} 0%, transparent 70%),
            radial-gradient(50% 60% at 0% 100%, #e6f4ff 0%, transparent 70%),
            linear-gradient(160deg, #ffffff 0%, #f6f5f9 100%)`,
          border: `1px solid ${C.line}`,
          boxShadow: "0 10px 30px rgba(26,29,46,0.06)",
        }}>
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: C.purple }}>{s.eyebrow}</div>
          <div className="text-xl font-extrabold mb-1" style={{ color: C.navy }}>{s.title}</div>
          <div className="text-[13px] mb-4" style={{ color: C.textSoft }}>{s.intro(total)}</div>

          <div className="flex rounded-full overflow-hidden mb-3" style={{ height: 10, background: C.line }}>
            {BANDS.map(b => (
              <div key={b.key} style={{ width: `${(counts[b.key] / total) * 100}%`, background: b.color }} />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {BANDS.map(b => {
              const active = band === b.key;
              return (
                <button key={b.key} onClick={() => { setBand(b.key); setShowAll(false); }} className="rounded-2xl px-2.5 py-2 text-left transition"
                  style={{ background: active ? "#fff" : "transparent", border: `1px solid ${active ? b.color : C.line}`, boxShadow: active ? `0 4px 14px ${b.color}33` : "none" }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: b.color }} />
                    <span className="text-[11px] font-semibold" style={{ color: C.navy }}>{s.bands[b.key]}</span>
                  </div>
                  <div className="text-lg font-extrabold leading-none" style={{ color: b.color }}>{counts[b.key]}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: C.textSoft }}>{b.min}–{b.max}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Star foods carousel */}
      <div className="pt-6">
        <div className="px-4"><SectionLabel>{s.topFoods}</SectionLabel></div>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2" style={{ scrollSnapType: "x mandatory" }}>
          {topFoods.map(([id, f]) => (
            <div key={id} style={{ width: 132, scrollSnapAlign: "start" }} className="shrink-0">
              <FoodCard id={id} food={f} lang={lang} />
            </div>
          ))}
        </div>
      </div>

      {/* Browse by band + category */}
      <div className="px-4 pt-5">
        <SectionLabel>{s.browse(s.bands[band])}</SectionLabel>
        <div className="text-[12px] mb-3" style={{ color: C.textSoft }}>{s.bandHelp[band]}</div>
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {["all", ...CATEGORY_ORDER].map(c => (
            <button key={c} onClick={() => { setCat(c); setShowAll(false); }} className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
              style={{ background: cat === c ? C.navy : "#fff", color: cat === c ? "#fff" : C.textSoft, border: `1px solid ${cat === c ? C.navy : C.line}` }}>
              {c === "all" ? t.all : t.categories[c]}
            </button>
          ))}
        </div>

        {visible.length ? (
          <>
            <div className="grid grid-cols-3 gap-2.5">
              {(showAll ? visible : visible.slice(0, PREVIEW)).map(([id, f]) => <FoodCard key={id} id={id} food={f} lang={lang} />)}
            </div>
            {visible.length > PREVIEW && (
              <button onClick={() => setShowAll(v => !v)} className="w-full mt-3 py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-1"
                style={{ background: "#fff", color: C.purple, border: `1px solid ${C.line}` }}>
                {showAll ? s.showLess : s.showAll(visible.length)}
                <ChevronDown size={15} style={{ transform: showAll ? "rotate(180deg)" : "none" }} />
              </button>
            )}
          </>
        ) : (
          <div className="rounded-2xl p-4 text-sm text-center" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.textSoft }}>{s.empty}</div>
        )}

        <div className="mt-5 rounded-2xl p-3 flex gap-2 text-xs" style={{ background: C.purpleSoft, color: C.navy }}>
          <Info size={15} color={C.purple} className="shrink-0 mt-px" />
          <span>{s.intoleranceNote}</span>
        </div>
      </div>
    </div>
  );
}
