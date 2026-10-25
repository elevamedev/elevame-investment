import { useState } from "react";
import { useV4Theme } from "../../context/ThemeContext.jsx";

/**
 * Shared bacterium row (brief 4.6). Closed: name, a flag (role + level,
 * colored by the decision table below), one line (the association
 * line when the row sits under a signal, otherwise plain text). Open:
 * the plain text, a "yours vs most people" bar for important
 * bacteria, and facts with their labels. No source line on the row
 * (Amina removed it 20 October).
 *
 * Flag color: Helper+low or Watch+high -> red (works against you);
 * Helper+normal/high or Watch+not-high -> teal (works for you);
 * everything else -> amber; Neutral shows the level alone, no color
 * judgement.
 */
const FACT_LABEL = {
  en: { does: "What it does", linked: "Linked to", raises: "What raises it", lowers: "What lowers it", good_to_know: "Good to know" },
  es: { does: "Qué hace", linked: "Relacionado con", raises: "Qué lo sube", lowers: "Qué lo baja", good_to_know: "Bueno saber" },
};

function flagColor(role, level, V) {
  if (role === "helper" && level === "low") return { bg: V.reS, text: V.reText };
  if (role === "watch" && level === "high") return { bg: V.reS, text: V.reText };
  if (role === "helper" && (level === "normal" || level === "high")) return { bg: V.enS, text: V.enText };
  if (role === "watch" && level !== "high") return { bg: V.enS, text: V.enText };
  return { bg: V.inS, text: V.inText };
}

export default function BacteriumRow({ name, role, level, levelLabel, line, plainText, important, clientScore, communityScore, facts = [], lang = "en" }) {
  const { V } = useV4Theme();
  const [open, setOpen] = useState(false);
  const flag = role && role !== "neutral" ? flagColor(role, level, V) : null;
  const t = FACT_LABEL[lang] || FACT_LABEL.en;

  return (
    <button onClick={() => setOpen(o => !o)} aria-expanded={open}
      className="block w-full text-left" style={{ padding: "14px 18px", minHeight: 56 }}>
      <div className="flex items-center gap-2">
        <b style={{ flex: 1, color: V.ink }}>{name}</b>
        {flag ? (
          <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 9px", borderRadius: 999, whiteSpace: "nowrap", background: flag.bg, color: flag.text }}>
            {levelLabel}
          </span>
        ) : levelLabel ? (
          <span style={{ fontSize: 12, fontWeight: 600, color: V.ink3 }}>{levelLabel}</span>
        ) : null}
        <span style={{ color: V.ink3, fontSize: 20, lineHeight: 1 }}>{open ? "⌃" : "›"}</span>
      </div>
      <div className="mt-1.5" style={{ color: V.ink2, fontSize: 13, lineHeight: 1.4 }}>{open ? plainText : (line || plainText)}</div>

      {open && (
        <div onClick={e => e.stopPropagation()}>
          {important && clientScore != null && communityScore != null && (
            <div style={{ position: "relative", height: 6, background: V.bg, borderRadius: 3, marginTop: 10 }} aria-hidden="true">
              <i style={{ position: "absolute", top: -4, left: `${communityScore}%`, width: 2, height: 14, background: V.ink3 }} />
              <i style={{ position: "absolute", top: -3, left: `${clientScore}%`, width: 12, height: 12, borderRadius: "50%", background: V.purple, transform: "translateX(-50%)" }} />
            </div>
          )}
          {facts.length > 0 && (
            <div style={{ display: "grid", gap: 8, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${V.line}` }}>
              {facts.map((f, i) => (
                <div key={i} style={{ fontSize: 14, color: V.ink2, lineHeight: 1.45 }}>
                  <span style={{ display: "block", fontWeight: 600, color: V.ink3, fontSize: 12, marginBottom: 1 }}>{t[f.label] || f.label}</span>
                  {f.text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </button>
  );
}
