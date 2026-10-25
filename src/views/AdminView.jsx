import { useState } from "react";
import { ArrowLeft, Check, X, LogOut } from "lucide-react";
import { C } from "../theme.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useAdminTestList, useAdminTestReview } from "../hooks/useAdminData.js";

/**
 * Staff-only review panel. Rendered instead of the normal client
 * AppShell when the signed-in user has a `staff` row (see
 * src/hooks/useAdminData.js's useStaffRole + how App.jsx wires this
 * in). Scope of this first pass, per the actual question asked
 * ("how does admin review?"):
 *   - Browse every test (admin) / assigned tests (clinician).
 *   - See and resolve data_quality_issues the parser logged.
 *   - Read the clinician-only condition_results (at-risk conditions)
 *     to inform what to write — clients never see this directly.
 *   - Write/edit insights (the client-safe worded text) and approve
 *     them — nothing reaches a client until `approved = true`.
 *   - Flag a food for a client (hide/annotate/keep) with a reason —
 *     this is the "nutrient scores high but conflicts with a diet
 *     rule or allergy" case.
 *   - Publish/unpublish a test (gates whether the client sees
 *     anything at all).
 * NOT in this pass: creating Auth users/passwords or assigning
 * clinicians to clients — those stay script-driven for now
 * (scripts/seed.mjs, scripts/registerKit.mjs, scripts/
 * grantStaffRole.mjs) since they need the service-role key, which a
 * browser session never has. An AI-drafted first pass at insights
 * isn't built here either — every insight above is written by the
 * signed-in staff member, by design (no auto-approved AI text).
 */
const COPY = {
  en: {
    title: "Review queue", signOut: "Sign out", back: "Back",
    client: "Client", kit: "Kit", test: "Test", status: "Status", issues: "open issues", none: "No tests yet.",
    published: "Published", unpublished: "Draft", publish: "Publish", unpublish: "Unpublish",
    dataQuality: "Data quality issues", noIssues: "No issues logged.", resolved: "Resolved", unresolve: "Re-open", resolve: "Mark resolved",
    atRisk: "At-risk conditions (clinician only)", noRisk: "Nothing flagged at risk.", associatedBacteria: "Associated bacteria",
    insights: "Insights (client-facing, theme pages)", noInsights: "No insights written yet.",
    addInsight: "Write an insight", theme: "Theme", insightStatus: "Status (optional)", title_en: "Title (EN)", title_es: "Title (ES)",
    text_en: "Client text (EN)", text_es: "Client text (ES)", save: "Save insight", approved: "Approved — visible to client", approve: "Approve", unapprove: "Unapprove",
    flags: "Food review flags", noFlags: "No flags yet.", addFlag: "Flag a food",
    food: "Food", reason: "Reason", action: "Action", note_en: "Note (EN)", note_es: "Note (ES)",
    actions: { hide: "Hide from client", annotate: "Keep, but annotate", keep: "Keep as-is" },
    saveFlag: "Save flag", remove: "Remove",
    good: "good", watch: "watch", act: "act",
  },
  es: {
    title: "Cola de revisión", signOut: "Cerrar sesión", back: "Atrás",
    client: "Cliente", kit: "Kit", test: "Test", status: "Estado", issues: "incidencias abiertas", none: "Todavía no hay tests.",
    published: "Publicado", unpublished: "Borrador", publish: "Publicar", unpublish: "Despublicar",
    dataQuality: "Incidencias de calidad de datos", noIssues: "No hay incidencias registradas.", resolved: "Resuelta", unresolve: "Reabrir", resolve: "Marcar resuelta",
    atRisk: "Condiciones en riesgo (solo clínico)", noRisk: "Nada marcado en riesgo.", associatedBacteria: "Bacterias asociadas",
    insights: "Insights (visibles al cliente, páginas de tema)", noInsights: "Todavía no hay insights escritos.",
    addInsight: "Escribir un insight", theme: "Tema", insightStatus: "Estado (opcional)", title_en: "Título (EN)", title_es: "Título (ES)",
    text_en: "Texto para el cliente (EN)", text_es: "Texto para el cliente (ES)", save: "Guardar insight", approved: "Aprobado — visible para el cliente", approve: "Aprobar", unapprove: "Quitar aprobación",
    flags: "Avisos de revisión de alimentos", noFlags: "Todavía no hay avisos.", addFlag: "Marcar un alimento",
    food: "Alimento", reason: "Motivo", action: "Acción", note_en: "Nota (EN)", note_es: "Nota (ES)",
    actions: { hide: "Ocultar al cliente", annotate: "Mantener, pero anotar", keep: "Mantener tal cual" },
    saveFlag: "Guardar aviso", remove: "Quitar",
    good: "bien", watch: "vigilar", act: "actuar",
  },
};

function Card({ children }) {
  return <div className="rounded-xl p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>{children}</div>;
}
function SectionTitle({ children }) {
  return <div className="text-sm font-bold mb-2" style={{ color: C.navy }}>{children}</div>;
}
function Field({ label, children }) {
  return (
    <label className="block mb-2.5">
      <div className="text-[11px] font-medium mb-1" style={{ color: C.textSoft }}>{label}</div>
      {children}
    </label>
  );
}
const inputStyle = { border: `1px solid ${C.line}`, color: C.text };

function AdminTestReview({ test, lang, onBack }) {
  const c = COPY[lang];
  const r = useAdminTestReview(test.id);
  const [insightForm, setInsightForm] = useState({ theme_id: "", status: "", title_en: "", title_es: "", client_text_en: "", client_text_es: "" });
  const [flagForm, setFlagForm] = useState({ food_id: "", reason: "", theme_id: "", action: "annotate", note_en: "", note_es: "" });
  const [busy, setBusy] = useState(false);

  async function submitInsight() {
    if (!insightForm.theme_id || !insightForm.title_en) return;
    setBusy(true);
    try {
      const { error } = await r.addInsight({ ...insightForm, status: insightForm.status || null, approved: false });
      if (!error) setInsightForm({ theme_id: "", status: "", title_en: "", title_es: "", client_text_en: "", client_text_es: "" });
    } finally { setBusy(false); }
  }

  async function submitFlag() {
    if (!flagForm.food_id || !flagForm.reason) return;
    setBusy(true);
    try {
      const { error } = await r.addFlag(flagForm);
      if (!error) setFlagForm({ food_id: "", reason: "", theme_id: "", action: "annotate", note_en: "", note_es: "" });
    } finally { setBusy(false); }
  }

  return (
    <div className="px-4 pt-4 pb-24">
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-medium mb-3" style={{ color: C.purple }}>
        <ArrowLeft size={14} /> {c.back}
      </button>
      <div className="text-lg font-extrabold mb-1" style={{ color: C.navy }}>{test.clients?.name}</div>
      <div className="text-xs mb-3" style={{ color: C.textSoft }}>{test.kits?.kit_code} · {c.test} {test.test_number} · {test.report_date}</div>

      <Card>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: test.published_at ? C.sageText : C.amberText }}>
            {test.published_at ? c.published : c.unpublished}
          </span>
          <button onClick={() => (test.published_at ? r.unpublish() : r.publish()).then(() => window.location.reload())}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: test.published_at ? C.redText : C.purple }}>
            {test.published_at ? c.unpublish : c.publish}
          </button>
        </div>
      </Card>

      <SectionTitle>{c.dataQuality}</SectionTitle>
      <Card>
        {!r.issues.length ? <div className="text-xs" style={{ color: C.textSoft }}>{c.noIssues}</div> : r.issues.map(issue => (
          <div key={issue.id} className="flex items-start justify-between gap-2 py-2" style={{ borderTop: `1px solid ${C.line}` }}>
            <div>
              <div className="text-[11px] font-semibold" style={{ color: C.navy }}>{issue.issue_type}</div>
              <div className="text-xs" style={{ color: C.textSoft }}>{issue.detail}</div>
            </div>
            <button onClick={() => r.setIssueResolved(issue.id, !issue.resolved)}
              className="px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap flex-shrink-0"
              style={{ background: issue.resolved ? C.sage + "1c" : C.card, color: issue.resolved ? C.sageText : C.textSoft, border: `1px solid ${issue.resolved ? C.sage : C.line}` }}>
              {issue.resolved ? c.resolved : c.resolve}
            </button>
          </div>
        ))}
      </Card>

      <SectionTitle>{c.atRisk}</SectionTitle>
      <Card>
        {!r.conditionResults.length ? <div className="text-xs" style={{ color: C.textSoft }}>{c.noRisk}</div> : (
          r.conditionResults.map((cr, i) => {
            const bacteriaNames = (cr.flagged_taxon_ids || []).map(id => r.taxaById[id] || id);
            return (
              <div key={cr.condition_id} className="py-2" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-full inline-block mb-1" style={{ background: C.red + "1c", color: C.redText }}>
                  {cr.conditions?.name_en || cr.condition_id}
                </span>
                {bacteriaNames.length > 0 && (
                  <div className="text-xs" style={{ color: C.textSoft }}>
                    {c.associatedBacteria}: <span style={{ color: C.navy, fontWeight: 600 }}>{bacteriaNames.join(", ")}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </Card>

      <SectionTitle>{c.insights}</SectionTitle>
      <Card>
        {!r.insights.length ? <div className="text-xs mb-3" style={{ color: C.textSoft }}>{c.noInsights}</div> : r.insights.map(ins => (
          <div key={ins.id} className="py-2.5" style={{ borderTop: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-sm font-semibold" style={{ color: C.text }}>{ins.title_en}</span>
              {ins.status && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: (ins.status === "good" ? C.sage : ins.status === "act" ? C.red : C.amber) + "1c", color: ins.status === "good" ? C.sageText : ins.status === "act" ? C.redText : C.amberText }}>
                  {c[ins.status]}
                </span>
              )}
            </div>
            <div className="text-xs mb-1.5" style={{ color: C.textSoft }}>{ins.client_text_en}</div>
            <button onClick={() => r.setInsightApproved(ins.id, !ins.approved)}
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg"
              style={{ background: ins.approved ? C.sage + "1c" : C.card, color: ins.approved ? C.sageText : C.textSoft, border: `1px solid ${ins.approved ? C.sage : C.line}` }}>
              {ins.approved ? <Check size={12} /> : null} {ins.approved ? c.approved : c.approve}
            </button>
          </div>
        ))}
        <div className="text-xs font-bold mt-3 mb-2" style={{ color: C.navy }}>{c.addInsight}</div>
        <Field label={c.theme}>
          <select value={insightForm.theme_id} onChange={e => setInsightForm({ ...insightForm, theme_id: e.target.value })}
            className="w-full text-sm rounded-lg px-3 py-2" style={inputStyle}>
            <option value="">—</option>
            {r.themes.map(th => <option key={th.id} value={th.id}>{th.name_en}</option>)}
          </select>
        </Field>
        <Field label={c.insightStatus}>
          <select value={insightForm.status} onChange={e => setInsightForm({ ...insightForm, status: e.target.value })}
            className="w-full text-sm rounded-lg px-3 py-2" style={inputStyle}>
            <option value="">—</option>
            <option value="good">{c.good}</option><option value="watch">{c.watch}</option><option value="act">{c.act}</option>
          </select>
        </Field>
        <Field label={c.title_en}><input value={insightForm.title_en} onChange={e => setInsightForm({ ...insightForm, title_en: e.target.value })} className="w-full text-sm rounded-lg px-3 py-2" style={inputStyle} /></Field>
        <Field label={c.title_es}><input value={insightForm.title_es} onChange={e => setInsightForm({ ...insightForm, title_es: e.target.value })} className="w-full text-sm rounded-lg px-3 py-2" style={inputStyle} /></Field>
        <Field label={c.text_en}><textarea value={insightForm.client_text_en} onChange={e => setInsightForm({ ...insightForm, client_text_en: e.target.value })} className="w-full text-sm rounded-lg px-3 py-2" style={{ ...inputStyle, minHeight: 60 }} /></Field>
        <Field label={c.text_es}><textarea value={insightForm.client_text_es} onChange={e => setInsightForm({ ...insightForm, client_text_es: e.target.value })} className="w-full text-sm rounded-lg px-3 py-2" style={{ ...inputStyle, minHeight: 60 }} /></Field>
        <button onClick={submitInsight} disabled={busy} className="w-full py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-60" style={{ background: C.purple }}>{c.save}</button>
      </Card>

      <SectionTitle>{c.flags}</SectionTitle>
      <Card>
        {!r.flags.length ? <div className="text-xs mb-3" style={{ color: C.textSoft }}>{c.noFlags}</div> : r.flags.map(f => (
          <div key={f.food_id} className="flex items-start justify-between gap-2 py-2" style={{ borderTop: `1px solid ${C.line}` }}>
            <div>
              <div className="text-[11px] font-semibold" style={{ color: C.navy }}>{r.foods.find(fo => fo.id === f.food_id)?.name_en || f.food_id} — {c.actions[f.action]}</div>
              <div className="text-xs" style={{ color: C.textSoft }}>{f.reason}</div>
            </div>
            <button onClick={() => r.removeFlag(f.food_id)} className="p-1.5 rounded-full flex-shrink-0" style={{ border: `1px solid ${C.line}` }}><X size={12} color={C.textSoft} /></button>
          </div>
        ))}
        <div className="text-xs font-bold mt-3 mb-2" style={{ color: C.navy }}>{c.addFlag}</div>
        <Field label={c.food}>
          <input list="admin-foods-list" value={flagForm.food_id} onChange={e => setFlagForm({ ...flagForm, food_id: e.target.value })}
            placeholder={c.food} className="w-full text-sm rounded-lg px-3 py-2" style={inputStyle} />
          <datalist id="admin-foods-list">{r.foods.map(f => <option key={f.id} value={f.id}>{f.name_en}</option>)}</datalist>
        </Field>
        <Field label={c.reason}><input value={flagForm.reason} onChange={e => setFlagForm({ ...flagForm, reason: e.target.value })} className="w-full text-sm rounded-lg px-3 py-2" style={inputStyle} /></Field>
        <Field label={c.theme}>
          <select value={flagForm.theme_id} onChange={e => setFlagForm({ ...flagForm, theme_id: e.target.value })} className="w-full text-sm rounded-lg px-3 py-2" style={inputStyle}>
            <option value="">—</option>
            {r.themes.map(th => <option key={th.id} value={th.id}>{th.name_en}</option>)}
          </select>
        </Field>
        <Field label={c.action}>
          <select value={flagForm.action} onChange={e => setFlagForm({ ...flagForm, action: e.target.value })} className="w-full text-sm rounded-lg px-3 py-2" style={inputStyle}>
            {Object.entries(c.actions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label={c.note_en}><input value={flagForm.note_en} onChange={e => setFlagForm({ ...flagForm, note_en: e.target.value })} className="w-full text-sm rounded-lg px-3 py-2" style={inputStyle} /></Field>
        <Field label={c.note_es}><input value={flagForm.note_es} onChange={e => setFlagForm({ ...flagForm, note_es: e.target.value })} className="w-full text-sm rounded-lg px-3 py-2" style={inputStyle} /></Field>
        <button onClick={submitFlag} disabled={busy} className="w-full py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-60" style={{ background: C.purple }}>{c.saveFlag}</button>
      </Card>
    </div>
  );
}

export default function AdminView({ lang, setLang }) {
  const { signOut } = useAuth();
  const { tests, loading } = useAdminTestList();
  const [selected, setSelected] = useState(null);
  const c = COPY[lang];

  if (selected) return <AdminTestReview test={selected} lang={lang} onBack={() => setSelected(null)} />;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: C.bg, minHeight: "100vh" }} className="max-w-md mx-auto relative">
      <div className="sticky top-0 z-10 px-4 pt-4 pb-2" style={{ background: C.bg }}>
        <div className="flex items-center justify-between mb-2">
          <div className="font-extrabold text-lg" style={{ color: C.navy }}>Eleva<span style={{ color: C.purple }}>me</span> <span style={{ color: C.textSoft, fontWeight: 600, fontSize: 14 }}>· {c.title}</span></div>
          <div className="flex items-center gap-1.5">
            {["en", "es"].map(l => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className="text-[11px] font-semibold px-2 py-1 rounded-full"
                style={{ background: lang === l ? C.navy : "#fff", color: lang === l ? "#fff" : C.textSoft, border: `1px solid ${lang === l ? C.navy : C.line}` }}>
                {l.toUpperCase()}
              </button>
            ))}
            <button onClick={signOut} title={c.signOut} aria-label={c.signOut} className="p-1.5 rounded-full" style={{ border: `1px solid ${C.line}` }}>
              <LogOut size={13} color={C.textSoft} />
            </button>
          </div>
        </div>
      </div>
      <div className="px-4 pb-24">
        {loading ? null : !tests.length ? (
          <div className="text-sm" style={{ color: C.textSoft }}>{c.none}</div>
        ) : tests.map(t => (
          <button key={t.id} onClick={() => setSelected(t)} className="w-full text-left rounded-xl p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: C.text }}>{t.clients?.name}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: t.published_at ? C.sage + "1c" : C.amber + "1c", color: t.published_at ? C.sageText : C.amberText }}>
                {t.published_at ? c.published : c.unpublished}
              </span>
            </div>
            <div className="text-xs mt-0.5" style={{ color: C.textSoft }}>{t.kits?.kit_code} · {c.test} {t.test_number}</div>
            {t.openIssueCount > 0 && <div className="text-xs mt-1 font-medium" style={{ color: C.redText }}>{t.openIssueCount} {c.issues}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}
