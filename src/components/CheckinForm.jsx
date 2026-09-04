import { useState, useEffect } from "react";
import { C } from "../theme.js";

export const BLANK_ENTRY = { energy: 3, digestion: 3, sleep: 3, mood: 3, bloating: false, notes: "" };

export default function CheckinForm({ t, initial, onSave, saveLabel, extraField }) {
  const [form, setForm] = useState(initial || BLANK_ENTRY);
  useEffect(() => { setForm(initial || BLANK_ENTRY); }, [initial]);
  return (
    <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      {["energy", "digestion", "sleep", "mood"].map(k => (
        <div key={k} className="mb-4 last:mb-0">
          <div className="flex justify-between text-sm mb-1.5">
            <span style={{ color: C.text }}>{t.fields[k]}</span>
            <span style={{ color: C.purple }} className="font-semibold">{form[k]}/5</span>
          </div>
          <input type="range" min="1" max="5" value={form[k]} onChange={e => setForm({ ...form, [k]: Number(e.target.value) })} className="w-full" style={{ accentColor: C.purple }} />
        </div>
      ))}
      <div className="flex items-center justify-between mb-4 mt-4">
        <span className="text-sm" style={{ color: C.text }}>{t.bloating}</span>
        <div className="flex gap-2">
          {[[t.no, false], [t.yes, true]].map(([label, val]) => (
            <button key={label} onClick={() => setForm({ ...form, bloating: val })} className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: form.bloating === val ? C.navy : "#fff", color: form.bloating === val ? "#fff" : C.textSoft, border: `1px solid ${form.bloating === val ? C.navy : C.line}` }}>{label}</button>
          ))}
        </div>
      </div>
      <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder={extraField || t.notesPlaceholder}
        className="w-full text-sm rounded-lg px-3 py-2 resize-none" style={{ border: `1px solid ${C.line}`, color: C.text, minHeight: 70 }} />
      <button onClick={() => onSave(form)} className="w-full mt-3 py-3 rounded-xl font-semibold text-white text-sm" style={{ background: C.purple }}>{saveLabel}</button>
    </div>
  );
}
