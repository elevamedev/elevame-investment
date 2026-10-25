import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useV4Theme } from "../../context/ThemeContext.jsx";
import { AUTH_COPY } from "./authCopy.js";
import AuthShell from "./AuthShell.jsx";
import AuthField from "./AuthField.jsx";
import AuthAlert from "./AuthAlert.jsx";

export default function SignInView() {
  const { V } = useV4Theme();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const passwordChanged = location.state?.passwordChanged;
  const [lang, setLang] = useState("en");
  const c = AUTH_COPY[lang];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null); // null | "mismatch" | "unconfirmed"
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: err } = await signIn(email, password);
    setSubmitting(false);
    if (!err) { navigate("/"); return; }
    setError(err.message?.toLowerCase().includes("confirm") || err.code === "email_not_confirmed" ? "unconfirmed" : "mismatch");
  }

  return (
    <AuthShell lang={lang} setLang={setLang} title={c.signInTitle} subtitle={c.signInSub} copy={c}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {passwordChanged && !error && (
          <div role="status" style={{ background: V.enS, color: V.enText, borderRadius: 12, padding: "12px 14px", fontSize: 14, lineHeight: 1.45 }}>
            {c.passwordChanged}
          </div>
        )}
        <AuthAlert>{error === "unconfirmed" ? c.emailNotConfirmed : error === "mismatch" ? c.signInError : null}</AuthAlert>
        <AuthField label={c.email} type="email" value={email} onChange={setEmail} autoComplete="email" error={!!error} />
        <AuthField label={c.password} type="password" value={password} onChange={setPassword} autoComplete="current-password" error={!!error} showHideLabels={c} />
        <Link to="/forgot" style={{ color: V.purple, fontWeight: 600, fontSize: 14, minHeight: 44, display: "inline-flex", alignItems: "center", alignSelf: "flex-end" }}>{c.forgot}</Link>
        <button type="submit" disabled={submitting} className="disabled:opacity-60" style={{ minHeight: 52, borderRadius: 14, background: V.purple, color: "#fff", fontWeight: 600, fontSize: 16 }}>
          {c.signInButton}
        </button>
      </form>
      <p style={{ textAlign: "center", color: V.ink2, fontSize: 14, margin: "16px 0 0" }}>
        {c.newToElevame} <Link to="/signup" style={{ color: V.purple, fontWeight: 600 }}>{c.createAccount}</Link>
      </p>
    </AuthShell>
  );
}
