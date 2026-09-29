import { useState } from "react";
import { C } from "../theme.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginView({ t, lang, setLang }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) setError(true);
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif", background: C.bg, minHeight: "100vh" }} className="max-w-md mx-auto relative flex flex-col justify-center px-6">
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
        <div className="text-xl font-bold mb-1" style={{ color: C.navy }}>{t.login.title}</div>
        <div className="text-sm mb-5" style={{ color: C.textSoft }}>{t.login.subtitle}</div>

        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSoft }}>{t.login.email}</label>
          <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full text-sm rounded-lg px-3 py-2.5 mb-4" style={{ border: `1px solid ${C.line}`, color: C.text }} />

          <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSoft }}>{t.login.password}</label>
          <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full text-sm rounded-lg px-3 py-2.5 mb-4" style={{ border: `1px solid ${C.line}`, color: C.text }} />

          {error && <div className="text-xs mb-4" style={{ color: C.red }}>{t.login.error}</div>}

          <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-60" style={{ background: C.purple }}>
            {submitting ? t.login.signingIn : t.login.signIn}
          </button>
        </form>
      </div>
    </div>
  );
}
