import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useV4Theme } from "../../context/ThemeContext.jsx";

/**
 * Bottom sheet overlay (mockup .scrim/.sheet/.grab/.close). Phase B
 * wires this to the route's `sheet` search param, so back/Escape
 * close it as a history entry (brief 1.1) — this component just
 * needs an `onClose` to call either way. Accessible by itself:
 * role="dialog", focus moves into the sheet on open and never gets
 * trapped invisibly (WCAG 2.2, review round 1 issue 29), Escape and a
 * scrim click both close it.
 */
export default function Sheet({ open, onClose, title, children, backLabel }) {
  const { V } = useV4Theme();
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    sheetRef.current?.focus();
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: open ? "auto" : "none" }} aria-hidden={!open}>
      <div onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(16,18,32,.35)", opacity: open ? 1 : 0, transition: "opacity .25s" }} />
      <div ref={sheetRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "86%", background: V.bg,
          borderRadius: "28px 28px 0 0", transform: open ? "none" : "translateY(100%)",
          transition: "transform .32s cubic-bezier(.2,.8,.2,1)", display: "flex", flexDirection: "column",
        }}>
        <div style={{ width: 40, height: 5, borderRadius: 3, background: "#d4d4de", margin: "10px auto 4px", flex: "none" }} />
        <button onClick={onClose} aria-label={backLabel || "Close"}
          style={{ position: "absolute", zIndex: 3, top: 12, right: 14, background: "rgba(255,255,255,.9)", boxShadow: "0 1px 2px rgba(21,23,42,.04), 0 6px 20px rgba(21,23,42,.05)", width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center" }}>
          <X size={20} color={V.ink2} />
        </button>
        <div style={{ overflowY: "auto", padding: "8px 20px 32px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
