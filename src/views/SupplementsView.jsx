import { C } from "../theme.js";
import { useReportV2 } from "../hooks/useReportV2.js";

const COPY = {
  en: {
    title: "Supplements",
    intro: "Prebiotic and probiotic products scored against your own report. EU-available options are shown first where a product has a local equivalent.",
    prebiotics: "Prebiotics",
    probiotics: "Probiotics",
    euEquivalent: name => `EU equivalent available: ${name}`,
    loading: "Loading your supplements...",
    noReport: "No report linked to your account yet.",
    none: "No supplement scores for this report yet.",
  },
  es: {
    title: "Suplementos",
    intro: "Productos prebióticos y probióticos puntuados según tu propio informe. Se muestran primero las opciones disponibles en la UE cuando un producto tiene un equivalente local.",
    prebiotics: "Prebióticos",
    probiotics: "Probióticos",
    euEquivalent: name => `Equivalente en la UE disponible: ${name}`,
    loading: "Cargando tus suplementos...",
    noReport: "Tu cuenta aún no tiene un informe vinculado.",
    none: "Todavía no hay puntuaciones de suplementos para este informe.",
  },
};

function SupplementRow({ item, euName }) {
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ background: C.card }}>
      <div className="min-w-0 pr-3">
        <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{item.product}</div>
        {item.brand && <div className="text-xs truncate" style={{ color: C.textSoft }}>{item.brand}</div>}
        {euName && <div className="text-[11px] mt-0.5" style={{ color: C.purple }}>{euName}</div>}
      </div>
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-md whitespace-nowrap flex-shrink-0"
        style={{ background: C.blue + "22", color: C.blueText, border: `1px solid ${C.blue}55` }}
      >
        {Number(item.score).toFixed(1)}
      </span>
    </div>
  );
}

function SupplementGroup({ label, items }) {
  if (!items.length) return null;
  return (
    <div className="mb-5">
      <div className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: C.textSoft }}>{label}</div>
      <div className="rounded-xl overflow-hidden divide-y" style={{ border: `1px solid ${C.line}` }}>
        {items.map((item, i) => (
          <div key={item.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
            <SupplementRow item={item} euName={item.euName} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SupplementsView({ lang, user }) {
  const c = COPY[lang] || COPY.en;
  const { supplements, supplementScores, loading, client } = useReportV2(user?.id);

  const supplementsById = Object.fromEntries((supplements || []).map(s => [s.id, s]));
  const scored = (supplementScores || [])
    .map(s => {
      const row = supplementsById[s.supplement_id];
      if (!row) return null;
      const equivalent = row.eu_equivalent_id ? supplementsById[row.eu_equivalent_id] : null;
      return { ...row, score: s.score, euName: equivalent?.product || null };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  const prebiotics = scored.filter(s => s.type === "prebiotic");
  const probiotics = scored.filter(s => s.type === "probiotic");

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="text-lg font-extrabold mb-1" style={{ color: C.navy }}>{c.title}</div>
      <div className="text-xs mb-5" style={{ color: C.textSoft }}>{c.intro}</div>

      {loading ? (
        <div className="text-sm text-center py-10" style={{ color: C.textSoft }}>{c.loading}</div>
      ) : !client ? (
        <div className="rounded-xl p-6 text-center text-sm" style={{ border: `1px solid ${C.line}`, color: C.textSoft }}>{c.noReport}</div>
      ) : !scored.length ? (
        <div className="rounded-xl p-6 text-center text-sm" style={{ border: `1px solid ${C.line}`, color: C.textSoft }}>{c.none}</div>
      ) : (
        <>
          <SupplementGroup label={c.prebiotics} items={prebiotics} />
          <SupplementGroup label={c.probiotics} items={probiotics} />
        </>
      )}
    </div>
  );
}
