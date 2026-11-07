import { useV4Theme } from "../../context/ThemeContext.jsx";

/**
 * Food score badge (brief: bands are Enrich 8-10 / Include 4-7 /
 * Reduce 0-3; mockup .sb/.sb.en/.sb.in/.sb.re). Small dot + score.
 */
export function bandFor(score) {
  return score >= 8 ? "enrich" : score >= 4 ? "include" : "reduce";
}

const BAND_COPY = {
  en: { enrich: "Enrich", include: "Include", reduce: "Reduce" },
  es: { enrich: "Enriquece", include: "Incluye", reduce: "Reduce" },
};

export function bandLabel(band, lang = "en") {
  return (BAND_COPY[lang] || BAND_COPY.en)[band];
}

export default function ScoreBadge({ score }) {
  const { V } = useV4Theme();
  const band = bandFor(score);
  const color = band === "enrich" ? V.en : band === "include" ? V.in : V.re;
  const bg = band === "enrich" ? V.enS : band === "include" ? V.inS : V.reS;
  const text = band === "enrich" ? V.enText : band === "include" ? V.inText : V.reText;
  return (
    <span className="inline-flex items-center gap-1.5" style={{ background: bg, color: text, font: "700 13px 'Manrope', sans-serif", padding: "3px 8px 3px 6px", borderRadius: 999 }}>
      <i style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
      {score}
    </span>
  );
}
