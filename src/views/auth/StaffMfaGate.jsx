import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useAAL } from "../../hooks/useAAL.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useV4Theme } from "../../context/ThemeContext.jsx";

const COPY = {
  enrollTitle: "Set up a second factor", enrollSub: "Admin and clinician accounts need an authenticator app (Google Authenticator, 1Password, Authy…) before you can continue.",
  scan: "Scan this QR code in your authenticator app, then enter the 6-digit code it shows.",
  challengeTitle: "Enter your code", challengeSub: "Open your authenticator app and enter the current 6-digit code.",
  codeLabel: "6-digit code", verify: "Verify", verifying: "Verifying…",
  error: "That code didn't work. Check your authenticator app and try again.",
  signOut: "Sign out",
};

/**
 * Gates /admin behind aal2 (brief 4.0). Three states: no TOTP factor
 * yet -> enroll (QR code + first verify, which also raises the
 * session to aal2); a factor exists but this session is only aal1 ->
 * challenge (enter the current code); already aal2 -> render
 * children straight through.
 */
export default function StaffMfaGate({ children }) {
  const { V } = useV4Theme();
  const { signOut } = useAuth();
  const { loading, currentLevel, refresh } = useAAL();
  const [factorId, setFactorId] = useState(null);
  const [enrollQr, setEnrollQr] = useState(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [checkingFactors, setCheckingFactors] = useState(true);

  useEffect(() => {
    if (loading || currentLevel === "aal2") { setCheckingFactors(false); return; }
    supabase.auth.mfa.listFactors().then(({ data, error: listError }) => {
      if (listError) { setCheckingFactors(false); return; }
      const verified = data.totp.find(f => f.status === "verified");
      if (verified) {
        setFactorId(verified.id);
        setCheckingFactors(false);
        return;
      }
      // No verified factor yet — enroll a new one.
      supabase.auth.mfa.enroll({ factorType: "totp" }).then(({ data: enrollData, error: enrollError }) => {
        if (!enrollError) { setFactorId(enrollData.id); setEnrollQr(enrollData.totp.qr_code); }
        setCheckingFactors(false);
      });
    });
  }, [loading, currentLevel]);

  async function handleVerify(e) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) { setBusy(false); setError(true); return; }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
    setBusy(false);
    if (verifyError) { setError(true); return; }
    await refresh();
  }

  if (loading || checkingFactors) {
    return <div style={{ background: V.bg, minHeight: "100vh" }} className="flex items-center justify-center" />;
  }
  if (currentLevel === "aal2") return children;

  const isEnrolling = !!enrollQr;

  return (
    <div style={{ background: V.page, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }} className="flex items-center justify-center px-4">
      <div className="w-full max-w-[390px]" style={{ background: V.card, borderRadius: 20, padding: "24px 20px", boxShadow: "0 1px 2px rgba(21,23,42,.04), 0 6px 20px rgba(21,23,42,.05)" }}>
        <h1 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 22, color: V.ink, margin: "0 0 8px" }}>
          {isEnrolling ? COPY.enrollTitle : COPY.challengeTitle}
        </h1>
        <p style={{ color: V.ink2, fontSize: 14, lineHeight: 1.5, margin: "0 0 16px" }}>
          {isEnrolling ? COPY.enrollSub : COPY.challengeSub}
        </p>
        {isEnrolling && (
          <>
            <p style={{ color: V.ink2, fontSize: 13, margin: "0 0 10px" }}>{COPY.scan}</p>
            <div style={{ background: "#fff", borderRadius: 12, padding: 12, marginBottom: 16, display: "flex", justifyContent: "center" }}>
              <img src={enrollQr} alt="Authenticator app QR code" width={180} height={180} />
            </div>
          </>
        )}
        <form onSubmit={handleVerify} className="flex flex-col gap-3">
          {error && <div role="alert" style={{ background: V.reS, color: V.reText, borderRadius: 12, padding: "10px 12px", fontSize: 13 }}>{COPY.error}</div>}
          <label className="flex flex-col gap-1.5">
            <span style={{ fontSize: 13, fontWeight: 600, color: V.ink2 }}>{COPY.codeLabel}</span>
            <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              style={{ border: `1.5px solid ${V.line}`, borderRadius: 14, minHeight: 52, padding: "0 14px", fontSize: 20, letterSpacing: "0.3em", textAlign: "center", color: V.ink }} />
          </label>
          <button type="submit" disabled={busy || code.length !== 6} className="disabled:opacity-60"
            style={{ minHeight: 52, borderRadius: 14, background: V.purple, color: "#fff", fontWeight: 600, fontSize: 16 }}>
            {busy ? COPY.verifying : COPY.verify}
          </button>
        </form>
        <button type="button" onClick={signOut} style={{ textAlign: "center", color: V.ink2, fontSize: 14, margin: "16px auto 0", display: "block", minHeight: 44 }}>
          {COPY.signOut}
        </button>
      </div>
    </div>
  );
}
