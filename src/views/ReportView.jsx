import { useEffect, useState } from "react";
import { C } from "../theme.js";
import { useReportV2 } from "../hooks/useReportV2.js";
import { REPORT_COPY } from "./reportCopy.js";
import ThemeDetailView from "./ThemeDetailView.jsx";

function ThemeCard({ theme, lang, onOpen }) {
  const name = lang === "es" ? (theme.name_es || theme.name_en) : (theme.name_en || theme.name_es);
  const question = lang === "es" ? (theme.client_question_es || theme.client_question_en) : (theme.client_question_en || theme.client_question_es);
  return (
    <button onClick={() => onOpen(theme)} className="text-left rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="text-sm font-bold mb-1" style={{ color: C.navy }}>{name}</div>
      {question && <div className="text-[11px]" style={{ color: C.textSoft }}>{question}</div>}
    </button>
  );
}

// Themes with their own dedicated view navigate straight there
// instead of through the generic ThemeDetailView.
export default function ReportView({ lang, user, onGoToFoods, onOpenSupplements, initialThemeId, onBackToInitialTheme }) {
  const data = useReportV2(user.id);
  const [openTheme, setOpenTheme] = useState(null);
  const cp = REPORT_COPY[lang] || REPORT_COPY.en;

  // Supports /system/:theme as a real deep-link (brief 1.1's route
  // table), reusing this view's existing data loading rather than
  // duplicating it — ThemeDetailView itself gets rebuilt properly in
  // Phase F; this just makes the URL work today.
  useEffect(() => {
    if (!initialThemeId || openTheme) return;
    const match = data.themes.find(t => t.id === initialThemeId);
    if (match) setOpenTheme(match);
  }, [initialThemeId, data.themes, openTheme]);

  function openThemeCard(theme) {
    if (theme.id === "food" && onGoToFoods) return onGoToFoods();
    if (theme.id === "supplements" && onOpenSupplements) return onOpenSupplements();
    setOpenTheme(theme);
  }

  if (data.loading && !data.themes.length) {
    return <div className="px-4 pt-8 text-sm text-center" style={{ color: C.textSoft }}>{cp.loading}</div>;
  }
  if (!data.client) {
    return <div className="px-4 pt-8 text-sm text-center" style={{ color: C.textSoft }}>{cp.emptyNoClient}</div>;
  }
  if (!data.selectedTestId) {
    return <div className="px-4 pt-8 text-sm text-center" style={{ color: C.textSoft }}>{cp.emptyNoTest}</div>;
  }

  if (openTheme) {
    return <ThemeDetailView theme={openTheme} lang={lang} data={data} onBack={() => { setOpenTheme(null); onBackToInitialTheme?.(); }} />;
  }

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="text-lg font-extrabold mb-1" style={{ color: C.navy }}>{cp.title}</div>
      <div className="text-sm mb-4" style={{ color: C.textSoft }}>{cp.intro}</div>

      {data.tests.length > 1 && (
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {data.tests.map(test => {
            const active = test.id === data.selectedTestId;
            return (
              <button key={test.id} onClick={() => data.setSelectedTestId(test.id)} aria-current={active ? "true" : undefined}
                className="px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap"
                style={{ background: active ? C.navy : "#fff", color: active ? "#fff" : C.textSoft, border: `1px solid ${active ? C.navy : C.line}` }}>
                {cp.retestLabel(test.test_number)}{test.report_date ? ` · ${test.report_date}` : ""}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {data.themes.map(theme => (
          <ThemeCard key={theme.id} theme={theme} lang={lang} onOpen={openThemeCard} />
        ))}
      </div>
    </div>
  );
}
