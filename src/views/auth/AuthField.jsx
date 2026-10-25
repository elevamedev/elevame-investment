import { useState } from "react";
import { useV4Theme } from "../../context/ThemeContext.jsx";

/**
 * A single auth form field (brief 4.0): 52px tall, label above,
 * autocomplete set, Show/Hide for passwords, never blocks paste
 * (WCAG 2.2, 3.3.8 — no onPaste handler here, by design).
 */
export default function AuthField({ label, type = "text", value, onChange, autoComplete, placeholder, error, hint, showHideLabels, uppercase, required = true }) {
  const { V } = useV4Theme();
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <label className="flex flex-col gap-1.5">
      <span style={{ fontSize: 13, fontWeight: 600, color: V.ink2 }}>{label}</span>
      <span className="flex items-center" style={{ border: `1.5px solid ${error ? V.re : V.line}`, borderRadius: 14, background: V.card, minHeight: 52, padding: "0 6px 0 14px" }}>
        <input
          type={inputType} value={value} onChange={e => onChange(e.target.value)} autoComplete={autoComplete}
          placeholder={placeholder} required={required} aria-invalid={error ? "true" : undefined}
          style={{ flex: 1, minWidth: 0, border: 0, background: "transparent", font: "500 16px inherit", color: V.ink, outline: "none", height: 48, textTransform: uppercase ? "uppercase" : "none" }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)} style={{ fontSize: 13, fontWeight: 700, color: V.purple, minHeight: 44, minWidth: 56 }}>
            {show ? (showHideLabels?.hide || "Hide") : (showHideLabels?.show || "Show")}
          </button>
        )}
      </span>
      {hint && !error && <span style={{ fontSize: 12, color: V.ink3 }}>{hint}</span>}
    </label>
  );
}
