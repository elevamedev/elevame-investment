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
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className="max-w-md w-full text-left text-sm rounded-xl px-4 py-3 shadow-lg"
          style={{
            pointerEvents: "auto",
            background: t.type === "error" ? C.red : C.navy,
            color: "#fff",
          }}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
