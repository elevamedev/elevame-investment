import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useV4Theme } from "../../context/ThemeContext.jsx";
import { AUTH_COPY } from "./authCopy.js";
import AuthShell from "./AuthShell.jsx";

/**
 * Token-hash route (brief 4.0). Supabase's default PKCE code link
 * only works in the browser that requested it, which breaks a reset
 * link opened on a different device than the one that asked for it.
 * This route works on any device: supabase.auth.verifyOtp({ type,
 * token_hash }) exchanges the emailed token directly.
 */
export default function ConfirmView() {
  const { V } = useV4Theme();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [lang] = useState("en");
  const c = AUTH_COPY[lang];
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const token_hash = params.get("token_hash");
    const type = params.get("type"); // "signup" or "recovery"
    if (!token_hash || !type) { setFailed(true); return; }
    supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
      if (error) { setFailed(true); return; }
      navigate(type === "recovery" ? "/reset" : "/link", { replace: true });
    });
  }, [params, navigate]);

  if (failed) {
    return (
      <AuthShell lang={lang} setLang={() => {}} title={c.confirmExpired} copy={c}>
        <Link to="/forgot" style={{ minHeight: 52, borderRadius: 14, background: V.purple, color: "#fff", fontWeight: 600, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {c.sendNewLink}
        </Link>
      </AuthShell>
    );
  }

  return (
    <div style={{ background: V.page, minHeight: "100vh" }} className="flex items-center justify-center">
      <div style={{ color: V.ink2, fontSize: 14 }}>{c.confirming}</div>
    </div>
  );
}
