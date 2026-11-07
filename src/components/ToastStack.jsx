import { C } from "../theme.js";
import { useToast } from "../context/ToastContext.jsx";

export default function ToastStack() {
  const { toasts, dismiss } = useToast();
  if (!toasts.length) return null;
  return (
    <div
      className="fixed top-3 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4"
      style={{ pointerEvents: "none" }}
      role="status"
      aria-live="polite"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          className="max-w-md w-full flex items-center gap-3 text-sm rounded-xl px-4 py-3 shadow-lg"
          style={{
            pointerEvents: "auto",
            background: t.type === "error" ? C.red : C.navy,
            color: "#fff",
          }}
        >
          <button onClick={() => dismiss(t.id)} className="flex-1 text-left">{t.message}</button>
          {t.action && (
            <button
              onClick={() => { t.action.onClick(); dismiss(t.id); }}
              className="flex-none font-semibold underline underline-offset-2"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
