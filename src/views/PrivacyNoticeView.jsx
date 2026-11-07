import { C } from "../theme.js";

const COPY = {
  en: {
    title: "Privacy notice",
    sections: [
      ["What we store", "Your gut test results, the check ins and notes you add, the meals and swaps you log, and your weight if you choose to give it."],
      ["Who can see it", "Your nutritionist can read your notes and check ins while “Share my progress with my nutritionist” is on in Settings. Turning it off hides them again."],
      ["Where it's stored", "On Supabase, hosted in the EU (Frankfurt), and on Vercel."],
      ["How long we keep it", "Until you delete your account."],
      ["Your rights", "You can download everything we hold about you, or delete your account and everything in it, any time from Settings."],
    ],
  },
  es: {
    title: "Aviso de privacidad",
    sections: [
      ["Qué guardamos", "Los resultados de tu análisis intestinal, los seguimientos y notas que añades, las comidas y cambios que registras, y tu peso si decides indicarlo."],
      ["Quién puede verlo", "Tu nutricionista puede leer tus notas y seguimientos mientras “Compartir mi progreso con mi nutricionista” esté activado en Ajustes. Al desactivarlo, deja de verlos."],
      ["Dónde se guarda", "En Supabase, alojado en la UE (Fráncfort), y en Vercel."],
      ["Cuánto tiempo lo guardamos", "Hasta que elimines tu cuenta."],
      ["Tus derechos", "Puedes descargar todo lo que guardamos sobre ti, o eliminar tu cuenta y todo su contenido, en cualquier momento desde Ajustes."],
    ],
  },
};

/**
 * Brief 6.5's required privacy notice content, shared by the consent
 * screen (shown before any result does) and Settings' "Privacy and
 * consent" row. No chrome of its own — callers supply the heading.
 */
export default function PrivacyNoticeView({ lang }) {
  const t = COPY[lang] || COPY.en;
  return (
    <div>
      {t.sections.map(([heading, body]) => (
        <div key={heading} className="mb-4">
          <div className="text-sm font-semibold mb-1" style={{ color: C.text }}>{heading}</div>
          <div className="text-sm" style={{ color: C.textSoft }}>{body}</div>
        </div>
      ))}
    </div>
  );
}

export { COPY as PRIVACY_COPY };
