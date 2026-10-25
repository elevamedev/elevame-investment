import { useState } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { C } from "../theme.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useV4Review } from "../hooks/useV4Review.js";

const COPY = {
  en: {
    title: "Review (v4 redesign content)", loading: "Loading…",
    safetyAlert: "Safety screen found", approveAll: "Approve all for this test", approveAllConfirm: "Approve every English and Spanish text for this test? This can't be bulk-undone.",
    status: "Body system status", signals: "Signals", levers: "Levers (what helps)", reportTexts: "Report sentences",
    education: "Body system science (reviewed once, for every client)", swapPairs: "Swap pairs (reviewed once, for every client)",
    noItems: "None yet.", en_: "English", es_: "Spanish", approveEn: "Approve English", approveEs: "Approve Spanish",
    approvedEn: "English approved", approvedEs: "Spanish approved", approve: "Approve", approved: "Approved",
    bacteria: "Bacteria", foods: "Foods",
  },
  es: {
    title: "Revisión (contenido del rediseño v4)", loading: "Cargando…",
    safetyAlert: "El control de seguridad encontró", approveAll: "Aprobar todo para este test", approveAllConfirm: "¿Aprobar todo el texto en inglés y español de este test? No se puede deshacer en bloque.",
    status: "Estado de los sistemas corporales", signals: "Señales", levers: "Palancas (qué ayuda)", reportTexts: "Frases del informe",
    education: "Ciencia de los sistemas corporales (revisado una vez, para todos los clientes)", swapPairs: "Pares de sustitución (revisado una vez, para todos los clientes)",
    noItems: "Todavía ninguno.", en_: "Inglés", es_: "Español", approveEn: "Aprobar inglés", approveEs: "Aprobar español",
    approvedEn: "Inglés aprobado", approvedEs: "Español aprobado", approve: "Aprobar", approved: "Aprobado",
    bacteria: "Bacterias", foods: "Alimentos",
  },
};

function Card({ children }) {
  return <div className="rounded-xl p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>{children}</div>;
}
function SectionTitle({ children }) {
  return <div className="text-sm font-bold mb-2" style={{ color: C.navy }}>{children}</div>;
}
const inputStyle = { border: `1px solid ${C.line}`, color: C.text };

function ApproveButton({ approved, label, approvedLabel, onClick }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg"
      style={{ background: approved ? C.sage + "1c" : C.card, color: approved ? C.sageText : C.textSoft, border: `1px solid ${approved ? C.sage : C.line}` }}>
      {approved ? <Check size={12} /> : null} {approved ? approvedLabel : label}
    </button>
  );
}

/** One gated row with an English text, an editable Spanish field, and separate Approve English / Approve Spanish buttons. */
function GatedField({ c, textEn, textEs, onChangeEs, enApproved, esApproved, onApproveEn, onApproveEs }) {
  return (
    <div className="py-2.5" style={{ borderTop: `1px solid ${C.line}` }}>
      <div className="text-xs mb-1" style={{ color: C.text }}>{textEn}</div>
      <textarea value={textEs || ""} onChange={e => onChangeEs(e.target.value)} placeholder={c.es_}
        className="w-full text-xs rounded-lg px-2 py-1.5 mb-1.5" style={{ ...inputStyle, minHeight: 44 }} />
      <div className="flex items-center gap-1.5">
        <ApproveButton approved={enApproved} label={c.approveEn} approvedLabel={c.approvedEn} onClick={onApproveEn} />
        <ApproveButton approved={esApproved} label={c.approveEs} approvedLabel={c.approvedEs} onClick={onApproveEs} />
      </div>
    </div>
  );
}

export default function ReviewV4Panel({ testId, lang }) {
  const c = COPY[lang];
  const { user } = useAuth();
  const r = useV4Review(testId);
  const [busy, setBusy] = useState(false);

  async function withBusy(fn) {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  }

  if (r.loading) return <div className="text-xs" style={{ color: C.textSoft }}>{c.loading}</div>;

  return (
    <>
      {r.detectedOrganisms.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: C.redText }}>
            <AlertTriangle size={14} /> {c.safetyAlert}: {r.detectedOrganisms.join(", ")}
          </div>
        </Card>
      )}

      <button disabled={busy}
        onClick={() => { if (window.confirm(c.approveAllConfirm)) withBusy(() => r.approveAllForTest(user?.id)); }}
        className="w-full py-2.5 rounded-xl font-semibold text-white text-sm mb-3 disabled:opacity-60" style={{ background: C.navy }}>
        {c.approveAll}
      </button>

      <SectionTitle>{c.status}</SectionTitle>
      <Card>
        {!r.statuses.length ? <div className="text-xs" style={{ color: C.textSoft }}>{c.noItems}</div> : r.statuses.map(s => (
          <GatedField key={s.theme_id} c={c}
            textEn={`${s.themes?.name_en || s.theme_id} — ${s.line_en}`} textEs={s.line_es}
            onChangeEs={v => withBusy(() => r.updateText("body_system_status", { test_id: testId, theme_id: s.theme_id }, "line_es", v))}
            enApproved={!!s.reviewed_at} esApproved={!!s.reviewed_es_at}
            onApproveEn={() => withBusy(() => s.reviewed_at ? r.unapproveEn("body_system_status", { test_id: testId, theme_id: s.theme_id }) : r.approveEn("body_system_status", { test_id: testId, theme_id: s.theme_id }, user?.id))}
            onApproveEs={() => withBusy(() => s.reviewed_es_at ? r.unapproveEs("body_system_status", { test_id: testId, theme_id: s.theme_id }) : r.approveEs("body_system_status", { test_id: testId, theme_id: s.theme_id }))}
          />
        ))}
      </Card>

      <SectionTitle>{c.signals}</SectionTitle>
      <Card>
        {!r.signals.length ? <div className="text-xs" style={{ color: C.textSoft }}>{c.noItems}</div> : r.signals.map(sig => (
          <div key={sig.id}>
            <GatedField c={c}
              textEn={`${sig.title_en}: ${sig.verdict_en}`} textEs={sig.verdict_es}
              onChangeEs={v => withBusy(() => r.updateText("body_system_signals", { id: sig.id }, "verdict_es", v))}
              enApproved={!!sig.reviewed_at} esApproved={!!sig.reviewed_es_at}
              onApproveEn={() => withBusy(() => sig.reviewed_at ? r.unapproveEn("body_system_signals", { id: sig.id }) : r.approveEn("body_system_signals", { id: sig.id }, user?.id))}
              onApproveEs={() => withBusy(() => sig.reviewed_es_at ? r.unapproveEs("body_system_signals", { id: sig.id }) : r.approveEs("body_system_signals", { id: sig.id }))}
            />
            {sig.signal_taxa?.length > 0 && (
              <div className="text-[11px] pl-2 mb-1" style={{ color: C.textSoft }}>
                {c.bacteria}: {sig.signal_taxa.map(st => st.taxa?.name || st.taxon_id).join(", ")}
              </div>
            )}
          </div>
        ))}
      </Card>

      <SectionTitle>{c.levers}</SectionTitle>
      <Card>
        {!r.levers.length ? <div className="text-xs" style={{ color: C.textSoft }}>{c.noItems}</div> : r.levers.map(lv => (
          <div key={lv.id}>
            <GatedField c={c}
              textEn={lv.text_en} textEs={lv.text_es}
              onChangeEs={v => withBusy(() => r.updateText("body_system_levers", { id: lv.id }, "text_es", v))}
              enApproved={!!lv.reviewed_at} esApproved={!!lv.reviewed_es_at}
              onApproveEn={() => withBusy(() => lv.reviewed_at ? r.unapproveEn("body_system_levers", { id: lv.id }) : r.approveEn("body_system_levers", { id: lv.id }, user?.id))}
              onApproveEs={() => withBusy(() => lv.reviewed_es_at ? r.unapproveEs("body_system_levers", { id: lv.id }) : r.approveEs("body_system_levers", { id: lv.id }))}
            />
            {lv.body_system_lever_foods?.length > 0 && (
              <div className="text-[11px] pl-2 mb-1" style={{ color: C.textSoft }}>
                {c.foods}: {lv.body_system_lever_foods.map(f => f.foods?.name_en || f.food_id).join(", ")}
              </div>
            )}
          </div>
        ))}
      </Card>

      <SectionTitle>{c.reportTexts}</SectionTitle>
      <Card>
        {!r.reportTexts.length ? <div className="text-xs" style={{ color: C.textSoft }}>{c.noItems}</div> : r.reportTexts.map(rt => (
          <GatedField key={rt.key} c={c}
            textEn={`${rt.key}: ${rt.text_en}`} textEs={rt.text_es}
            onChangeEs={v => withBusy(() => r.updateText("report_texts", { test_id: testId, key: rt.key }, "text_es", v))}
            enApproved={!!rt.reviewed_at} esApproved={!!rt.reviewed_es_at}
            onApproveEn={() => withBusy(() => rt.reviewed_at ? r.unapproveEn("report_texts", { test_id: testId, key: rt.key }) : r.approveEn("report_texts", { test_id: testId, key: rt.key }, user?.id))}
            onApproveEs={() => withBusy(() => rt.reviewed_es_at ? r.unapproveEs("report_texts", { test_id: testId, key: rt.key }) : r.approveEs("report_texts", { test_id: testId, key: rt.key }))}
          />
        ))}
      </Card>

      <SectionTitle>{c.education}</SectionTitle>
      <Card>
        {!r.education.length ? <div className="text-xs" style={{ color: C.textSoft }}>{c.noItems}</div> : r.education.map(ed => (
          <div key={ed.theme_id} className="py-2.5" style={{ borderTop: `1px solid ${C.line}` }}>
            <div className="text-xs mb-1.5" style={{ color: C.text }}>{ed.hook_en}</div>
            <ApproveButton approved={!!ed.reviewed_at} label={c.approve} approvedLabel={c.approved}
              onClick={() => withBusy(() => ed.reviewed_at ? r.unapproveEducation(ed.theme_id) : r.approveEducation(ed.theme_id))} />
          </div>
        ))}
      </Card>

      <SectionTitle>{c.swapPairs}</SectionTitle>
      <Card>
        {!r.swapPairs.length ? <div className="text-xs" style={{ color: C.textSoft }}>{c.noItems}</div> : r.swapPairs.map(sp => (
          <div key={`${sp.from_food_id}-${sp.to_food_id}`} className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.line}` }}>
            <div className="text-xs" style={{ color: C.text }}>{sp.from_food?.name_en || sp.from_food_id} → {sp.to_food?.name_en || sp.to_food_id}</div>
            <ApproveButton approved={!!sp.approved} label={c.approve} approvedLabel={c.approved}
              onClick={() => withBusy(() => sp.approved ? r.unapproveSwapPair(sp.from_food_id, sp.to_food_id) : r.approveSwapPair(sp.from_food_id, sp.to_food_id, user?.id))} />
          </div>
        ))}
      </Card>
    </>
  );
}
