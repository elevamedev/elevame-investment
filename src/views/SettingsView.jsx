import { LogOut } from "lucide-react";
import { C } from "../theme.js";

const ES_RELEASED = import.meta.env.VITE_ES_RELEASED === "true";

const COPY = {
  en: { title: "Settings", language: "Language", signOut: "Sign out", placeholder: "More settings (reminders, daily check-in questions, your data) are coming soon." },
  es: { title: "Ajustes", language: "Idioma", signOut: "Cerrar sesión", placeholder: "Más ajustes (recordatorios, preguntas del registro diario, tus datos) llegarán pronto." },
};

/**
 * Minimal placeholder so /settings exists as a real tab (brief 1.1's
 * route table). The full screen — theme, text size, reminders, daily
 * check-in questions, food rules, portions, share-with-nutritionist,
 * data export/delete, consent — is brief 4.11 / Phase P.
 */
export default function SettingsView({ lang, setLang, profile, onSignOut }) {
  const c = COPY[lang] || COPY.en;
  return (
    <div className="px-4 pt-4 pb-24">
      <div className="text-lg font-extrabold mb-4" style={{ color: C.navy }}>{c.title}</div>

      <div className="rounded-xl p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-sm font-semibold mb-1" style={{ color: C.text }}>{profile?.full_name}</div>
        {profile?.kit_code && <div className="text-xs" style={{ color: C.textSoft }}>{profile.kit_code}</div>}
      </div>

      {ES_RELEASED && (
        <div className="rounded-xl p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-xs font-medium mb-2" style={{ color: C.textSoft }}>{c.language}</div>
          <div className="flex gap-1.5">
            {["en", "es"].map(l => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                style={{ background: lang === l ? C.navy : "#fff", color: lang === l ? "#fff" : C.textSoft, border: `1px solid ${lang === l ? C.navy : C.line}` }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs mb-4" style={{ color: C.textSoft }}>{c.placeholder}</div>

      <button onClick={onSignOut} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
        style={{ background: C.card, border: `1px solid ${C.line}`, color: C.text }}>
        <LogOut size={16} /> {c.signOut}
      </button>
    </div>
  );
}
