import { useV4Theme } from "../../context/ThemeContext.jsx";

/**
 * Body system status mark (brief 4.1, mockup .dot.st-act/.st-watch/.st-good).
 * Review round 1 issue 29: amber was a filled dot, failing to read as
 * distinct from red/teal at a glance — fixed to a ring, not fill.
 * Carries visually hidden text with the status word, since color
 * alone never conveys status (WCAG 1.4.1).
 */
const WORD = { act: { en: "Needs support", es: "Necesita apoyo" }, watch: { en: "Could be better", es: "Podría mejorar" }, good: { en: "Good", es: "Bien" } };

export default function StatusMark({ status, lang = "en", size = 8 }) {
  const { V } = useV4Theme();
  const color = status === "act" ? V.re : status === "watch" ? V.in : V.good;
  const isRing = status === "watch";
  return (
    <span
      style={{
        display: "inline-block", width: size, height: size, borderRadius: "50%", flex: "none",
        background: isRing ? "transparent" : color,
        boxShadow: isRing ? `inset 0 0 0 2px ${color}` : "none",
      }}
    >
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
        {WORD[status]?.[lang] || status}
      </span>
    </span>
  );
}
