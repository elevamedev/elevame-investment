import { useMemo } from "react";
import { Check } from "lucide-react";
import { C } from "../theme.js";
import { CATEGORY_ORDER, foodName } from "../data/foods.js";
import { groceryFor } from "../data/planTemplate.js";
import SectionLabel from "../components/SectionLabel.jsx";
import PhaseTabs from "../components/PhaseTabs.jsx";

export default function ShoppingView({ lang, t, phases, phaseIdx, setPhaseIdx, checks, toggleCheck, resetPhase }) {
  const phase = phases[phaseIdx];
  const grocery = useMemo(() => groceryFor(phase), [phase]);
  const phaseChecks = checks[phase.id] || {};

  return (
    <div className="px-4 pt-4 pb-24">
      <PhaseTabs lang={lang} phases={phases} phaseIdx={phaseIdx} onSelect={setPhaseIdx} />
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold" style={{ color: C.text }}>{t.groceryListFor(phase.weeks[lang])}</div>
        <button onClick={() => resetPhase(phase.id)} className="text-xs font-medium" style={{ color: C.purple }}>{t.reset}</button>
      </div>
      {CATEGORY_ORDER.map(cat => {
        const ids = grocery[cat].slice().sort((a, b) => foodName(a, lang).localeCompare(foodName(b, lang)));
        if (ids.length === 0) return null;
        return (
          <div key={cat} className="mb-5">
            <SectionLabel>{t.categories[cat]}</SectionLabel>
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
              {ids.map((id, i) => {
                const checked = !!phaseChecks[id];
                return (
                  <button key={id} onClick={() => toggleCheck(phase.id, id)} className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    style={{ background: checked ? "#f5f3fb" : C.card, borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: checked ? C.purple : "#fff", border: `1.5px solid ${checked ? C.purple : C.line}` }}>
                      {checked && <Check size={13} color="#fff" strokeWidth={3} />}
                    </div>
                    <span className="text-sm" style={{ color: checked ? C.textSoft : C.text, textDecoration: checked ? "line-through" : "none" }}>{foodName(id, lang)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
