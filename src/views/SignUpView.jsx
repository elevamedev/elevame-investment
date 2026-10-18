import { useState } from "react";
import { C } from "../theme.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function SignUpView({ t, lang, setLang, onSwitchToSignIn }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    const { error, needsEmailConfirmation } = await signUp(email, password);
    setSubmitting(false);
    if (error) { setError(true); return; }
    if (needsEmailConfirmation) setCheckEmail(true);
    // Otherwise the AuthContext session updates on its own and the
    // app re-renders straight into the claim-kit screen.
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: C.bg, minHeight: "100vh" }} className="max-w-md mx-auto relative flex flex-col justify-center px-6">
      <div className="flex items-center justify-between mb-8">
        <div className="font-extrabold text-lg" style={{ color: C.navy }}>Eleva<span style={{ color: C.purple }}>me</span></div>
        <div className="flex items-center gap-1.5">
          {["en", "es"].map(l => (
            <button key={l} type="button" onClick={() => setLang(l)} className="text-[11px] font-semibold px-2 py-1 rounded-full"
              style={{ background: lang === l ? C.navy : "#fff", color: lang === l ? "#fff" : C.textSoft, border: `1px solid ${lang === l ? C.navy : C.line}` }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-6" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-xl font-bold mb-1" style={{ color: C.navy }}>{t.signUp.title}</div>
        <div className="text-sm mb-5" style={{ color: C.textSoft }}>{t.signUp.subtitle}</div>

        {checkEmail ? (
          <div className="text-sm rounded-xl p-4" style={{ background: C.purpleSoft, color: C.navy }}>{t.signUp.checkEmail}</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSoft }}>{t.signUp.email}</label>
            <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full text-sm rounded-lg px-3 py-2.5 mb-4" style={{ border: `1px solid ${C.line}`, color: C.text }} />

            <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSoft }}>{t.signUp.password}</label>
            <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full text-sm rounded-lg px-3 py-2.5 mb-1" style={{ border: `1px solid ${C.line}`, color: C.text }} />
            <div className="text-xs mb-4" style={{ color: C.textSoft }}>{t.signUp.passwordHint}</div>

            {error && <div className="text-xs mb-4" style={{ color: C.redText }}>{t.signUp.error}</div>}

            <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-60" style={{ background: C.purple }}>
              {submitting ? t.signUp.creating : t.signUp.createAccount}
            </button>
          </form>
        )}
      </div>

      <div className="text-center text-sm mt-5" style={{ color: C.textSoft }}>
        {t.signUp.haveAccount}{" "}
        <button type="button" onClick={onSwitchToSignIn} className="font-semibold" style={{ color: C.purple }}>
          {t.signUp.signIn}
        </button>
      </div>
    </div>
  );
}
