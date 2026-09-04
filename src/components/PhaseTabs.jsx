import { C } from "../theme.js";

export default function PhaseTabs({ lang, phases, phaseIdx, onSelect }) {
  return (
    <div className="flex gap-2 mb-4">
      {phases.map((p, i) => (
        <button key={p.id} onClick={() => onSelect(i)} className="flex-1 py-2 rounded-lg text-xs font-semibold"
          style={{ background: i === phaseIdx ? C.navy : C.card, color: i === phaseIdx ? "#fff" : C.textSoft, border: `1px solid ${i === phaseIdx ? C.navy : C.line}` }}>
          {lang === "en" ? `Phase ${i + 1}` : `Fase ${i + 1}`}
        </button>
      ))}
    </div>
  );
}
