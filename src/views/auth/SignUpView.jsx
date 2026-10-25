import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useV4Theme } from "../../context/ThemeContext.jsx";
import { AUTH_COPY } from "./authCopy.js";
import AuthShell from "./AuthShell.jsx";
import AuthField from "./AuthField.jsx";

const RESEND_WAIT_SECONDS = 60;

export default function SignUpView() {
  const { V } = useV4Theme();
  const { signUp } = useAuth();
  const [lang, setLang] = useState("en");
  const c = AUTH_COPY[lang];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    await signUp(email, password); // Supabase answers the same way whether or not the email already has an account
    setSubmitting(false);
    setSent(true);
    startResendTimer();
  }

  function startResendTimer() {
    setResendIn(RESEND_WAIT_SECONDS);
    const id = setInterval(() => {
      setResendIn(n => { if (n <= 1) { clearInterval(id); return 0; } return n - 1; });
    }, 1000);
  }

  async function handleResend() {
    if (resendIn > 0) return;
    await signUp(email, password);
    startResendTimer();
  }

  if (sent) {
    return (
      <AuthShell lang={lang} setLang={setLang} copy={c} center
        icon={<Mail color="#fff" size={26} />}
        title={c.checkInboxTitle}
        subtitle={c.createSent(email)}>
        <div className="flex flex-col gap-2">
          <Link to="/signin" style={{ minHeight: 52, borderRadius: 14, background: V.purple, color: "#fff", fontWeight: 600, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            {c.backToSignIn}
          </Link>
          <button type="button" onClick={handleResend} disabled={resendIn > 0}
            style={{ color: V.purple, fontWeight: 600, fontSize: 14, minHeight: 44, alignSelf: "center" }}>
            {resendIn > 0 ? c.resendWait(resendIn) : c.resend}
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell lang={lang} setLang={setLang} title={c.createTitle} subtitle={c.createSub} copy={c}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <AuthField label={c.email} type="email" value={email} onChange={setEmail} autoComplete="email" />
        <AuthField label={c.password} type="password" value={password} onChange={setPassword} autoComplete="new-password" hint={c.passwordHint} showHideLabels={c} />
        <button type="submit" disabled={submitting} className="disabled:opacity-60" style={{ minHeight: 52, borderRadius: 14, background: V.purple, color: "#fff", fontWeight: 600, fontSize: 16 }}>
          {c.createButton}
        </button>
      </form>
      <p style={{ textAlign: "center", color: V.ink2, fontSize: 14, margin: "16px 0 0" }}>
        {c.haveAccount} <Link to="/signin" style={{ color: V.purple, fontWeight: 600 }}>{c.signIn}</Link>
      </p>
    </AuthShell>
  );
}
