import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { supabase } from "../../lib/supabaseClient.js";
import { useV4Theme } from "../../context/ThemeContext.jsx";
import { AUTH_COPY } from "./authCopy.js";
import AuthShell from "./AuthShell.jsx";
import AuthField from "./AuthField.jsx";

export default function ForgotPasswordView() {
  const { V } = useV4Theme();
  const [lang, setLang] = useState("en");
  const c = AUTH_COPY[lang];
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

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
  }

  if (sent) {
    return (
      <AuthShell lang={lang} setLang={setLang} copy={c} center
        icon={<Mail color="#fff" size={26} />}
        title={c.checkInboxTitle}
        subtitle={c.forgotSent(email)}>
        <Link to="/signin" style={{ minHeight: 52, borderRadius: 14, background: V.purple, color: "#fff", fontWeight: 600, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {c.backToSignIn}
        </Link>
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
