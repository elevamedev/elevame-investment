import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useV4Theme } from "../../context/ThemeContext.jsx";
import { AUTH_COPY } from "./authCopy.js";
import AuthShell from "./AuthShell.jsx";
import AuthField from "./AuthField.jsx";
import AuthAlert from "./AuthAlert.jsx";

/**
 * "Choose a new password" (brief 4.0). Reached after ConfirmView's
 * verifyOtp(type: "recovery") succeeds, which leaves a session — just
 * not one to stay signed in with. After saving, every session is
 * signed out (OWASP: never auto-sign-in after a reset) and the
 * client lands back on sign in with a success message.
 */
export default function ResetPasswordView() {
  const { V } = useV4Theme();
  const navigate = useNavigate();
  const [lang, setLang] = useState("en");
  const c = AUTH_COPY[lang];
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setSubmitting(false);
      setError(updateError.message);
      return;
    }
    await supabase.auth.signOut({ scope: "global" });
    navigate("/signin", { replace: true, state: { passwordChanged: true } });
  }

  return (
    <AuthShell lang={lang} setLang={setLang} title={c.resetTitle} copy={c}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <AuthAlert>{error}</AuthAlert>
        <AuthField label={c.password} type="password" value={password} onChange={setPassword}
          autoComplete="new-password" hint={c.passwordHint} showHideLabels={c} />
        <button type="submit" disabled={submitting} className="disabled:opacity-60" style={{ minHeight: 52, borderRadius: 14, background: V.purple, color: "#fff", fontWeight: 600, fontSize: 16 }}>
          {c.resetButton}
        </button>
      </form>
    </AuthShell>
  );
}
