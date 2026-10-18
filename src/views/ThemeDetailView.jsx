import { useState } from "react";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { C } from "../theme.js";
import { REPORT_COPY, TAG_FOR_BADGE, COLOR_FOR_BADGE } from "./reportCopy.js";
import GenusChart from "../components/GenusChart.jsx";

function StatusPill({ status, cp }) {
  if (!status || !COLOR_FOR_BADGE[status]) return null;
  const color = C[COLOR_FOR_BADGE[status]];
  const label = cp[TAG_FOR_BADGE[status]];
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: color + "1c", color }}>
      {label}
    </span>
  );
}

function InsightCard({ insight, lang, cp, open, onToggle }) {
  const title = lang === "es" ? (insight.title_es || insight.title_en) : (insight.title_en || insight.title_es);
  const body = lang === "es" ? (insight.client_text_es || insight.client_text_en) : (insight.client_text_en || insight.client_text_es);
  return (
    <div className="rounded-xl mb-3 overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <button onClick={onToggle} aria-expanded={open} className="w-full text-left p-4" style={{ cursor: "pointer" }}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold" style={{ color: C.text }}>{title}</span>
          <div className="flex items-center gap-1.5">
            <StatusPill status={insight.status} cp={cp} />
            <ChevronDown size={14} color={C.textSoft} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
          </div>
        </div>
      </button>
      {open && body && (
        <div className="px-4 pb-4 text-xs" style={{ color: C.textSoft, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>{body}</div>
      )}
    </div>
  );
}

function MetricRow({ metric, result, lang, cp, metricInsights, open, onToggle }) {
  const name = lang === "es" ? (metric.name_es || metric.name_en) : (metric.name_en || metric.name_es);
  const badge = result.printed_badge;
  // metric_results.printed_comment has no per-language variant in the
  // v2 schema (it's the report's own printed text, English-sourced) —
  // shown as-is regardless of `lang` until the data model adds one.
  const comment = result.printed_comment;
  const explanation = lang === "es" ? (metric.explanation_es || metric.explanation_en) : (metric.explanation_en || metric.explanation_es);
  const hasDetail = explanation || metricInsights.length > 0;
  return (
    <div className="rounded-xl mb-3 overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <button onClick={hasDetail ? onToggle : undefined} aria-expanded={hasDetail ? open : undefined}
        className="w-full text-left p-4" style={{ cursor: hasDetail ? "pointer" : "default" }}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold" style={{ color: C.text }}>{name}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold" style={{ color: badge && COLOR_FOR_BADGE[badge] ? C[COLOR_FOR_BADGE[badge]] : C.text }}>
              {result.value ?? result.value_text ?? "—"}
            </span>
            <StatusPill status={badge} cp={cp} />
            {hasDetail && <ChevronDown size={14} color={C.textSoft} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />}
          </div>
        </div>
        {comment && <div className="text-xs mt-1.5" style={{ color: C.textSoft }}>{comment}</div>}
      </button>
      {hasDetail && open && (
        <div className="px-4 pb-4" style={{ borderTop: `1px solid ${C.line}` }}>
          {explanation && <div className="text-xs pt-3" style={{ color: C.textSoft }}>{explanation}</div>}
          {metricInsights.map(ins => (
            <div key={ins.id} className="text-xs pt-2 mt-2" style={{ color: C.text, borderTop: explanation || metricInsights[0] !== ins ? `1px solid ${C.line}` : "none" }}>
              {lang === "es" ? (ins.client_text_es || ins.client_text_en) : (ins.client_text_en || ins.client_text_es)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SafetySection({ data, lang, cp }) {
  if (!data.screenResults?.length) return null;
  const byPanel = {};
  data.screenResults.forEach(r => {
    (byPanel[r.panel_id] ||= { detected: 0, notDetected: 0 });
    if (r.status === "detected") byPanel[r.panel_id].detected++; else byPanel[r.panel_id].notDetected++;
  });
  const panelsById = Object.fromEntries((data.screenPanels || []).map(p => [p.id, p]));
  return (
    <div className="mb-5">
      <div className="text-sm font-semibold mb-3" style={{ color: C.text }}>{cp.safetyTitle}</div>
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
        {Object.entries(byPanel).map(([panelId, counts], i) => {
          const panel = panelsById[panelId];
          const name = panel ? (lang === "es" ? (panel.name_es || panel.name_en) : panel.name_en) : panelId;
          return (
            <div key={panelId} className="flex items-center justify-between px-4 py-3" style={{ background: C.card, borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
              <span className="text-sm" style={{ color: C.text }}>{name}</span>
              <span className="text-xs" style={{ color: counts.detected ? C.redText : C.sageText }}>
                {counts.detected ? `${counts.detected} ${cp.detected}` : `0 ${cp.detected}`} · {counts.notDetected} {cp.notDetected}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ThemeDetailView({ theme, lang, data, onBack }) {
  const cp = REPORT_COPY[lang] || REPORT_COPY.en;
  const name = lang === "es" ? (theme.name_es || theme.name_en) : (theme.name_en || theme.name_es);
  const [openMetricId, setOpenMetricId] = useState(null);
  const [openInsightId, setOpenInsightId] = useState(null);

  // Theme-level insights (no specific metric tag) stay at the top,
  // same as before. Insights linked to one specific metric (via
  // linked_metric_ids) move into that metric row's expand instead of
  // being shown twice.
  const allThemeInsights = (data.insights || []).filter(i => i.theme_id === theme.id);
  const insightsByMetric = {};
  allThemeInsights.forEach(ins => (ins.linked_metric_ids || []).forEach(mid => (insightsByMetric[mid] ||= []).push(ins)));
  const metricTaggedInsightIds = new Set(Object.values(insightsByMetric).flat().map(i => i.id));
  const insights = allThemeInsights.filter(i => !metricTaggedInsightIds.has(i.id));
  const resultsByMetric = Object.fromEntries((data.metricResults || []).map(r => [r.metric_id, r]));
  const metrics = (data.metrics || [])
    .filter(m => m.theme_id === theme.id)
    .map(m => ({ metric: m, result: resultsByMetric[m.id] }))
    .filter(x => x.result);

  return (
    <div className="px-4 pt-4 pb-24">
      <button onClick={onBack} className="flex items-center gap-1 mb-4 text-sm font-medium" style={{ color: C.purple }}>
        <ChevronLeft size={16} /> {cp.back}
      </button>
      <div className="text-lg font-extrabold mb-4" style={{ color: C.navy }}>{name}</div>

      {insights.length > 0 ? (
        insights.map(ins => (
          <InsightCard key={ins.id} insight={ins} lang={lang} cp={cp}
            open={openInsightId === ins.id}
            onToggle={() => setOpenInsightId(id => id === ins.id ? null : ins.id)} />
        ))
      ) : (
        <div className="rounded-xl p-4 mb-4 text-sm text-center" style={{ border: `1px solid ${C.line}`, color: C.textSoft }}>{cp.nothingFlagged}</div>
      )}

      {theme.id === "overview" && (
        <div className="mb-5">
          <GenusChart lang={lang} genusAbundance={data.genusAbundance} keyBacteria={data.keyBacteria} taxaById={data.taxaById} />
        </div>
      )}
      {theme.id === "safety" && <SafetySection data={data} lang={lang} cp={cp} />}

      {metrics.length > 0 && metrics.map(({ metric, result }) => (
        <MetricRow key={metric.id} metric={metric} result={result} lang={lang} cp={cp}
          metricInsights={insightsByMetric[metric.id] || []}
          open={openMetricId === metric.id}
          onToggle={() => setOpenMetricId(id => id === metric.id ? null : metric.id)} />
      ))}
      {metrics.length === 0 && theme.id !== "overview" && theme.id !== "safety" && (
        <div className="text-xs text-center py-2" style={{ color: C.textSoft }}>{cp.noMetricsYet}</div>
      )}
    </div>
  );
}
