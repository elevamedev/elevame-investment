import { Lock } from "lucide-react";
import { useV4Theme } from "../../context/ThemeContext.jsx";

const ES_RELEASED = import.meta.env.VITE_ES_RELEASED === "true";

/**
 * Shared auth-screen shell (brief 4.0): wordmark, EN/ES switch (only
 * when VITE_ES_RELEASED), heading/sub, a card for the form, and the
 * privacy line footer. Every field inside is 52px tall per the
 * brief's own spec — AuthField below handles that.
 */
export default function AuthShell({ lang, setLang, title, subtitle, eyebrow, icon, center, children, copy }) {
  const { V } = useV4Theme();
  return (
    <div style={{ background: V.page, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }} className="flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[390px] flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>
        <div className="flex items-center justify-between mb-6">
          <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 22, color: V.ink }}>
            Eleva<span style={{ color: V.purple }}>me</span>
          </div>
          {ES_RELEASED && (
            <div className="flex" style={{ background: V.bg, borderRadius: 10, padding: 3, gap: 2 }}>
              {["en", "es"].map(l => (
                <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l}
                  style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, minHeight: 40, color: lang === l ? V.ink : V.ink2, background: lang === l ? V.card : "transparent" }}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4" style={center ? { textAlign: "center" } : undefined}>
          {icon && (
            <span style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${V.purple}, ${V.purpleL})`, display: "inline-grid", placeItems: "center", marginBottom: 8 }}>
              {icon}
            </span>
          )}
          {eyebrow && <span style={{ fontSize: 12, fontWeight: 700, color: V.purple, background: V.purpleS, padding: "4px 10px", borderRadius: 999, display: "inline-block", marginBottom: 10 }}>{eyebrow}</span>}
          <h1 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-0.02em", margin: "10px 0 8px", color: V.ink }}>{title}</h1>
          {subtitle && <p style={{ color: V.ink2, margin: 0, lineHeight: 1.5 }}>{subtitle}</p>}
        </div>

        <div style={{ background: V.card, borderRadius: 20, boxShadow: "0 1px 2px rgba(21,23,42,.04), 0 6px 20px rgba(21,23,42,.05)", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          {children}
        </div>

        <p className="flex items-start justify-center gap-2 text-center" style={{ fontSize: 12, color: V.ink3, margin: "auto 8px 0", paddingTop: 24, lineHeight: 1.45 }}>
          <Lock size={14} style={{ flex: "none", marginTop: 1 }} /> {copy.privacy}
        </p>
      </div>
    </div>
  );
}
