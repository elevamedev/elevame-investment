import { useEffect, useState } from "react";
import { C } from "../../theme.js";
import { useV4Theme } from "../../context/ThemeContext.jsx";
import StatusMark from "./StatusMark.jsx";
import ScoreBar from "./ScoreBar.jsx";
import { supabase } from "../../lib/supabaseClient.js";

/** Rule 9: "sits between A and B" when the two closest reference groups are within 10 of each other, else "sits closest to A". */
export function sitsCompareText(value, markers, lang) {
  if (!markers || markers.length < 1) return null;
  const sorted = [...markers].map(m => ({ ...m, dist: Math.abs(value - m.value) })).sort((a, b) => a.dist - b.dist);
  const [a, b] = sorted;
  if (b && Math.abs(a.dist - b.dist) < 10) {
    return lang === "es" ? `Tu ${value} está entre ${a.label_en} y ${b.label_en}.` : `Your ${value} sits between ${a.label_en} and ${b.label_en}.`;
  }
  return lang === "es" ? `Tu ${value} está más cerca de ${a.label_en}.` : `Your ${value} sits closest to ${a.label_en}.`;
}

/**
 * Shared score sheet (brief 4.7), opened from My gut and from a body
 * system page's score bars alike, so the two screens can't drift.
 */
export default function ScoreSheetContent({ item, lang, t, navigate }) {
  const { V } = useV4Theme();
  const [taxa, setTaxa] = useState([]);
  const { metric, result } = item;

  useEffect(() => {
    let cancelled = false;
    supabase.from("v_score_taxa").select("*").eq("metric_id", metric.id)
      .then(({ data }) => { if (!cancelled) setTaxa(data || []); });
    return () => { cancelled = true; };
  }, [metric.id]);

  const planLinkKey = metric.id === "processed_food_index" ? "plan_link_processed" : metric.id === "sugar_index" ? "plan_link_sugar" : null;
  const compareText = sitsCompareText(result.value, item.markers, lang);

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 20, color: C.navy }}>{lang === "es" ? metric.client_name_es || metric.name_es : metric.client_name_en || metric.name_en}</h2>
        {result.printed_badge && <StatusMark status={result.printed_badge} lang={lang} size={9} />}
      </div>
      <p className="text-sm mb-3" style={{ color: C.textSoft }}>{lang === "es" ? metric.plain_es || metric.plain_en : metric.plain_en}</p>
      <ScoreBar value={result.value} community={result.community_value} markers={item.markers} direction={metric.direction} big />
      {compareText && <p className="text-sm font-medium mb-3" style={{ color: C.text }}>{compareText}</p>}
      <div className="rounded-xl overflow-hidden mb-3" style={{ border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between px-4 py-2.5" style={{ background: C.card }}>
          <span className="text-sm" style={{ color: C.text }}>{t.you(result.value)}</span><b className="text-sm">{result.value}</b>
        </div>
        {[...item.markers].sort((a, b) => a.value - b.value).map((m, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: `1px solid ${C.line}` }}>
            <span className="text-sm" style={{ color: C.textSoft }}>{lang === "es" ? m.label_es || m.label_en : m.label_en}</span><span className="text-sm">{m.value}</span>
          </div>
        ))}
      </div>
      <div className="text-xs font-semibold mb-1.5" style={{ color: C.navy }}>{t.bacteriaCounted(taxa.length)}</div>
      <p className="text-xs mb-2" style={{ color: C.textSoft }}>{t.plainSentence}</p>
      {taxa.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-3" style={{ border: `1px solid ${C.line}` }}>
          {taxa.map((row, i) => (
            <div key={row.taxon_id} className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
              <span className="text-sm" style={{ color: C.text }}>{row.name}</span>
              <span className="text-xs font-medium" style={{ color: C.textSoft }}>{row.status}</span>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => navigate(`/system/${metric.theme_id}`)} className="text-sm font-semibold mb-2" style={{ color: V.purple }}>{t.partOf(metric.theme_id)} →</button>
      <br />
      {planLinkKey && item.reportTexts?.[planLinkKey] && (
        <button onClick={() => navigate("/plan")} className="text-sm font-semibold" style={{ color: V.purple }}>
          {t.planWorks}: {lang === "es" ? item.reportTexts[planLinkKey].text_es || item.reportTexts[planLinkKey].text_en : item.reportTexts[planLinkKey].text_en}
        </button>
      )}
      <p className="text-xs mt-4" style={{ color: C.textSoft }}>{t.groupingFooter}</p>
    </div>
  );
}
