import { ChevronLeft, ChevronRight } from "lucide-react";
import { C } from "../theme.js";
import PhaseTabs from "../components/PhaseTabs.jsx";
import FoodChip from "../components/FoodChip.jsx";

export default function PlanView({ lang, t, phases, phaseIdx, setPhaseIdx, dayIdx, setDayIdx }) {
  const phase = phases[phaseIdx];
  const day = phase.days[dayIdx];
  return (
    <div className="px-4 pt-4 pb-24">
      <PhaseTabs lang={lang} phases={phases} phaseIdx={phaseIdx} onSelect={i => { setPhaseIdx(i); setDayIdx(0); }} />
      <div className="mb-1 font-semibold" style={{ color: C.text }}>{phase.subtitle[lang]} · {phase.weeks[lang]}</div>
      <div className="text-sm mb-4" style={{ color: C.textSoft }}>{phase.blurb[lang]}</div>

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setDayIdx(Math.max(0, dayIdx - 1))} className="p-2 rounded-lg" style={{ background: C.card, border: `1px solid ${C.line}` }}><ChevronLeft size={16} color={C.text} /></button>
        <div className="flex gap-1.5">
          {phase.days.map((_, i) => (
            <button key={i} onClick={() => setDayIdx(i)} className="w-8 h-8 rounded-full text-xs font-semibold"
              style={{ background: i === dayIdx ? C.purple : C.card, color: i === dayIdx ? "#fff" : C.textSoft, border: `1px solid ${i === dayIdx ? C.purple : C.line}` }}>{i + 1}</button>
          ))}
        </div>
        <button onClick={() => setDayIdx(Math.min(phase.days.length - 1, dayIdx + 1))} className="p-2 rounded-lg" style={{ background: C.card, border: `1px solid ${C.line}` }}><ChevronRight size={16} color={C.text} /></button>
      </div>

      <div className="space-y-3">
        {day.meals.map((m, i) => (
          <div key={i} className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <span className="text-[11px] font-semibold tracking-wide" style={{ color: C.purple }}>{t.meal[m.labelKey]}</span>
            <div className="font-semibold mt-1 mb-1.5" style={{ color: C.text }}>{m.dish[lang]}</div>
            {m.desc && <div className="text-sm mb-2" style={{ color: C.textSoft }}>{m.desc[lang]}</div>}
            <div className="flex flex-wrap">{m.foods.map(id => <FoodChip key={id} id={id} lang={lang} />)}</div>
          </div>
        ))}
        {day.tip && (
          <div className="rounded-xl p-4" style={{ background: C.purpleSoft }}>
            <div className="text-sm" style={{ color: C.navy }}><span className="font-semibold">{t.antiInflamNote}</span>{day.tip[lang]}</div>
          </div>
        )}
      </div>
    </div>
  );
}
