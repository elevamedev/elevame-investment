import { useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useV4Theme } from "../../context/ThemeContext.jsx";
import { AUTH_COPY } from "./authCopy.js";
import AuthShell from "./AuthShell.jsx";
import AuthField from "./AuthField.jsx";
import AuthAlert from "./AuthAlert.jsx";

const ERROR_KEYS = { not_found: "errorNotFound", email_mismatch: "errorEmailMismatch", already_claimed: "errorAlreadyClaimed" };

/**
 * "Link your kit", step 2 of 2 (brief 4.0). Replaces ClaimKitView —
 * same claim_kit RPC, but with the account's own email prefilled, the
 * full 4-state error copy, and no DebugPanel (that panel printed the
 * session id and token details on screen; it only existed to
 * diagnose the stale-RLS-policy bug found and fixed earlier, and the
 * brief explicitly calls for removing it).
 */
export default function LinkKitView({ lang: langProp, setLang: setLangProp, onClaimed }) {
  const { user, signOut } = useAuth();
  const { V } = useV4Theme();
  const [langState, setLangState] = useState("en");
  const lang = langProp ?? langState;
  const setLang = setLangProp ?? setLangState;
  const c = AUTH_COPY[lang];
  const [kitCode, setKitCode] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc("claim_kit", {
      p_kit_code: kitCode.trim().toUpperCase().replace(/\s+/g, ""),
      p_email: email.trim(),
    });
    setSubmitting(false);
    if (rpcError) { setError("errorGeneric"); return; }
    if (!data.success) { setError(ERROR_KEYS[data.error] || "errorGeneric"); return; }
    onClaimed?.();
  }

  return (
    <AuthShell lang={lang} setLang={setLang} eyebrow={c.linkStep} title={c.linkTitle} subtitle={c.linkSub} copy={c}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <AuthAlert>{error ? c[error] : null}</AuthAlert>
        <AuthField label={c.kitCode} value={kitCode} onChange={setKitCode} placeholder="ELVMWB0000" uppercase error={!!error} />
        <AuthField label={c.emailOnFile} type="email" value={email} onChange={setEmail} autoComplete="email" />
        <button type="submit" disabled={submitting} className="disabled:opacity-60" style={{ minHeight: 52, borderRadius: 14, background: V.purple, color: "#fff", fontWeight: 600, fontSize: 16 }}>
          {c.linkButton}
        </button>
      </form>
      <p style={{ textAlign: "center", color: V.ink2, fontSize: 14, margin: "16px 0 0" }}>
        {c.cantFindCode} <a href="mailto:hola@elevame.es" style={{ color: V.purple, fontWeight: 600 }}>{c.messageNutritionist}</a>
      </p>
      <button type="button" onClick={signOut} style={{ textAlign: "center", color: V.ink2, fontSize: 14, margin: "8px auto 0", display: "block", minHeight: 44 }}>
        {c.signOut}
      </button>
    </AuthShell>
  );
}
