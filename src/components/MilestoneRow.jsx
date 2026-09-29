import { Check, Activity, ChevronRight } from "lucide-react";
import { C } from "../theme.js";
import CheckinForm from "./CheckinForm.jsx";

export default function MilestoneRow({ t, lang, milestone, entry, planDay, isOpen, onOpen, onSave }) {
  const locked = planDay < milestone.day;
  const done = !!entry;
  return (
    <div className="rounded-xl mb-3 overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
      <button onClick={() => !locked && onOpen(isOpen ? null : milestone.id)} disabled={locked} className="w-full flex items-center gap-3 px-4 py-3 text-left" style={{ background: C.card }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: done ? C.teal + "22" : locked ? C.line : C.purpleSoft }}>
          {done ? <Check size={15} color={C.teal} strokeWidth={3} /> : <Activity size={14} color={locked ? C.textSoft : C.purple} />}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold" style={{ color: C.text }}>{milestone.label[lang]}</div>
          <div className="text-xs" style={{ color: C.textSoft }}>{locked ? t.unlocksOnDay(milestone.day) : done ? t.loggedTapEdit : milestone.hint[lang]}</div>
        </div>
        {!locked && <ChevronRight size={16} color={C.textSoft} style={{ transform: isOpen ? "rotate(90deg)" : "none" }} />}
      </button>
      {isOpen && !locked && (
        <div className="p-3 pt-0">
          <CheckinForm t={t} initial={entry} saveLabel={t.saveCheckinFor(milestone.label[lang])} extraField={t.milestoneExtraPlaceholder} onSave={form => onSave(milestone.id, form)} />
        </div>
      )}
    </div>
  );
}
