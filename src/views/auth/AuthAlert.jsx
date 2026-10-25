import { useEffect, useRef } from "react";
import { useV4Theme } from "../../context/ThemeContext.jsx";

/** Error box with role="alert"; focus moves here when it appears (brief 4.0). */
export default function AuthAlert({ children }) {
  const { V } = useV4Theme();
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, [children]);
  if (!children) return null;
  return (
    <div ref={ref} role="alert" tabIndex={-1}
      style={{ background: V.reS, color: V.reText, borderRadius: 12, padding: "12px 14px", fontSize: 14, lineHeight: 1.45, outline: "none" }}>
      {children}
    </div>
  );
}
