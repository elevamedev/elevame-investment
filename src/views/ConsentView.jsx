import { useState } from "react";
import { useC } from "../theme.js";
import PrivacyNoticeView from "./PrivacyNoticeView.jsx";

const COPY = {
  en: {
    title: "Before we show your results",
    agreement: "I agree that Elevame processes my gut test results and the check ins I add, to give me my plan and so my nutritionist can follow my progress.",
    privacyLink: "Read the privacy notice",
    agree: "Agree and continue",
    hideNotice: "Hide the privacy notice",
  },
  es: {
    title: "Antes de mostrar tus resultados",
    agreement: "Acepto que Elevame procese los resultados de mi análisis intestinal y los seguimientos que añada, para darme mi plan y para que mi nutricionista pueda seguir mi progreso.",
    privacyLink: "Leer el aviso de privacidad",
    agree: "Aceptar y continuar",
    hideNotice: "Ocultar el aviso de privacidad",
  },
};

/**
 * Brief 6.5: shown after linking a kit and before any result shows.
 * Blocks the whole client app (wired into App.jsx's RequireClient)
 * until the client ticks the box and agrees — `has_health_consent()`
 * is what the database itself checks before returning health data.
 */
export default function ConsentView({ lang, onAgree }) {
  const t = COPY[lang] || COPY.en;
  const C = useC();
  const [checked, setChecked] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAgree() {
    setSaving(true);
    await onAgree();
    setSaving(false);
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }} className="max-w-md mx-auto px-4 pt-10 pb-10">
      <h1 className="text-lg font-bold mb-6" style={{ color: C.navy, fontFamily: "'Manrope', sans-serif" }}>{t.title}</h1>

      <label className="flex items-start gap-3 mb-4 rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
          style={{ width: 22, height: 22, marginTop: 1, flex: "none" }} />
        <span className="text-sm" style={{ color: C.text }}>{t.agreement}</span>
      </label>

      <button onClick={() => setShowNotice(s => !s)} className="text-sm font-semibold mb-4" style={{ color: C.purpleText }}>
        {showNotice ? t.hideNotice : t.privacyLink}
      </button>

      {showNotice && <div className="mb-4"><PrivacyNoticeView lang={lang} /></div>}

      <button onClick={handleAgree} disabled={!checked || saving}
        className="w-full text-sm font-semibold py-3 rounded-xl"
        style={{ background: checked ? C.purple : C.purpleSoft, color: checked ? "#fff" : C.purpleText }}>
        {t.agree}
      </button>
    </div>
  );
}
