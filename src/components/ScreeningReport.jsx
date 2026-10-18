import { useState } from "react";
import { ChevronDown, ShieldCheck, ShieldAlert } from "lucide-react";
import { C } from "../theme.js";
import { SCREENING_CATEGORY_ORDER, SCREENING_CATEGORY_LABELS, SCREENING_CATEGORY_NOTES } from "../data/screeningTemplate.js";

function CategoryGroup({ t, lang, category, items, open, onToggle }) {
  const anyDetected = items.some(i => i.status === "detected");
  return (
    <div className="rounded-xl mb-3 overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <button onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-2.5">
          {anyDetected ? <ShieldAlert size={16} color={C.redText} /> : <ShieldCheck size={16} color={C.sageText} />}
          <div>
            <div className="text-sm font-semibold" style={{ color: C.text }}>{SCREENING_CATEGORY_LABELS[category][lang]}</div>
            <div className="text-[11px]" style={{ color: C.textSoft }}>
              {anyDetected ? t.screening.someDetected : t.screening.allClear}
            </div>
          </div>
        </div>
        <ChevronDown size={16} color={C.textSoft} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${C.line}` }}>
          <div className="px-4 pt-3 text-xs" style={{ color: C.textSoft }}>{SCREENING_CATEGORY_NOTES[category][lang]}</div>
          {items.map((item, i) => (
            <div key={item.key} className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}`, marginTop: i === 0 ? 8 : 0 }}>
              <span className="text-sm" style={{ color: C.text }}>{item.name[lang]}</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2" style={{
                background: item.status === "detected" ? C.red + "1c" : C.sage + "1c",
                color: item.status === "detected" ? C.redText : C.sageText,
              }}>
                {item.status === "detected" ? (item.abundance_pct != null ? t.screening.detectedPct(item.abundance_pct) : t.screening.detected) : t.screening.notDetected}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScreeningReport({ t, lang, findings }) {
  const [openCat, setOpenCat] = useState(null);
  const byCategory = {};
  findings.forEach(f => { (byCategory[f.category] ||= []).push(f); });
  const categories = SCREENING_CATEGORY_ORDER.filter(c => byCategory[c]?.length);
  if (categories.length === 0) return null;

  return (
    <div>
      <div className="text-xs mb-3" style={{ color: C.textSoft }}>{t.screening.intro}</div>
      {categories.map(cat => (
        <CategoryGroup key={cat} t={t} lang={lang} category={cat} items={byCategory[cat]}
          open={openCat === cat} onToggle={() => setOpenCat(o => o === cat ? null : cat)} />
      ))}
    </div>
  );
}
