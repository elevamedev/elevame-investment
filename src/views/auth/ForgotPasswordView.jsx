import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { supabase } from "../../lib/supabaseClient.js";
import { useV4Theme } from "../../context/ThemeContext.jsx";
import { AUTH_COPY } from "./authCopy.js";
import AuthShell from "./AuthShell.jsx";
import AuthField from "./AuthField.jsx";

const RESEND_WAIT_SECONDS = 60;

export default function ForgotPasswordView() {
  const { V } = useV4Theme();
  const [lang, setLang] = useState("en");
  const c = AUTH_COPY[lang];
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  function startResendTimer() {
    setResendIn(RESEND_WAIT_SECONDS);
    const id = setInterval(() => {
      setResendIn(n => { if (n <= 1) { clearInterval(id); return 0; } return n - 1; });
    }, 1000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    // The message never reveals whether the email has an account
    // (brief 4.0 / OWASP Forgot Password cheat sheet) — so the UI
    // shows the same "sent" screen whatever Supabase returns. The
    // link itself comes from the Reset password email template
    // (supabase/templates/recovery.html), which points at
    // /auth/confirm?token_hash=...&type=recovery directly.
    await supabase.auth.resetPasswordForEmail(email);
    setSubmitting(false);
    setSent(true);
    startResendTimer();
  }

  // Supabase itself rate-limits resetPasswordForEmail to once every 60
  // seconds (acceptance test 9/8's "60 second resend wait"); disabling
  // the resend button for that long keeps a second request from ever
  // hitting that limit and surfacing a raw rate-limit error instead of
  // this screen's own copy.
  async function handleResend() {
    if (resendIn > 0) return;
    await supabase.auth.resetPasswordForEmail(email);
    startResendTimer();
  }

  if (sent) {
    return (
      <AuthShell lang={lang} setLang={setLang} copy={c} center
        icon={<Mail color="#fff" size={26} />}
        title={c.checkInboxTitle}
        subtitle={c.forgotSent(email)}>
        <div className="flex flex-col gap-2">
          <Link to="/signin" style={{ minHeight: 52, borderRadius: 14, background: V.purple, color: "#fff", fontWeight: 600, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
    <AuthShell lang={lang} setLang={setLang} title={c.forgotTitle} subtitle={c.forgotSub} copy={c}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <AuthField label={c.email} type="email" value={email} onChange={setEmail} autoComplete="email" />
        <button type="submit" disabled={submitting} className="disabled:opacity-60" style={{ minHeight: 52, borderRadius: 14, background: V.purple, color: "#fff", fontWeight: 600, fontSize: 16 }}>
          {c.forgotButton}
        </button>
      </form>
      <Link to="/signin" style={{ textAlign: "center", color: V.ink2, fontSize: 14, margin: "16px 0 0", display: "block" }}>{c.backToSignIn}</Link>
    </AuthShell>
  );
}
