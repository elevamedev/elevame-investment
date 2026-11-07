import { useC } from "../../theme.js";
import LineChart from "./LineChart.jsx";

const QUESTION_LABEL = {
  en: { digestion: "Digestion", bloating: "Bloating", energy: "Energy", sleep: "Sleep", mood: "Mood" },
  es: { digestion: "Digestión", bloating: "Hinchazón", energy: "Energía", sleep: "Sueño", mood: "Ánimo" },
};

const COPY = {
  en: {
    notYet: "No check in yet today", goToCheckin: "Go to today's check in",
    weeklyAverages: "Weekly averages", upFrom: (a, b) => `Up from ${a} to ${b}`, downFrom: (a, b) => `Down from ${a} to ${b}`, steadyAt: b => `Steady at ${b}`,
    startsAfter: "Your chart starts after your second week.",
    habitsTitle: "Your habits and how you feel",
    doneSkipped: (d, s) => `Done ${d} of 5 · Skipped ${s} of 5`,
    better: d => `Digestion is ${d} points better on days you do it`, worse: d => `Digestion is ${d} points lower on days you do it`, noDiff: "No clear difference yet",
    addDigestion: "Add digestion to your daily check in to see this.",
    patternNote: "This shows a pattern in your own days, not proof that the habit causes it.",
    howTracking: "How tracking works",
    dailyRow: "A few taps a day, right on Home.", phaseRow: "A longer check in at the start and end of each phase.", chartsRow: "Both feed the charts here.",
  },
  es: {
    notYet: "Aún no hay seguimiento hoy", goToCheckin: "Ir al seguimiento de hoy",
    weeklyAverages: "Medias semanales", upFrom: (a, b) => `Sube de ${a} a ${b}`, downFrom: (a, b) => `Baja de ${a} a ${b}`, steadyAt: b => `Estable en ${b}`,
    startsAfter: "Tu gráfico empieza después de tu segunda semana.",
    habitsTitle: "Tus hábitos y cómo te sientes",
    doneSkipped: (d, s) => `Hecho ${d} de 5 · Saltado ${s} de 5`,
    better: d => `La digestión es ${d} puntos mejor los días que lo haces`, worse: d => `La digestión es ${d} puntos peor los días que lo haces`, noDiff: "Aún sin diferencia clara",
    addDigestion: "Añade digestión a tu seguimiento diario para ver esto.",
    patternNote: "Esto muestra un patrón en tus propios días, no una prueba de que el hábito lo causa.",
    howTracking: "Cómo funciona el seguimiento",
    dailyRow: "Unos toques al día, en Inicio.", phaseRow: "Un seguimiento más largo al empezar y terminar cada fase.", chartsRow: "Ambos alimentan estos gráficos.",
  },
};

export default function FeelSheet({ dailyQuestions, todayCheckin, weeklyByQuestion, habitRows, lang, onGoToCheckin }) {
  const t = COPY[lang] || COPY.en;
  const C = useC();
  const answered = dailyQuestions.filter(q => todayCheckin?.[q] != null);
  const todayAvg = answered.length ? Math.round((answered.reduce((s, q) => s + todayCheckin[q], 0) / answered.length) * 10) / 10 : null;

  const digestionInHabits = dailyQuestions.includes("digestion");

  return (
    <div>
      {todayAvg != null ? (
        <div className="text-2xl font-bold mb-4" style={{ color: C.navy }}>{todayAvg} / 5</div>
      ) : (
        <div className="mb-4">
          <div className="text-sm font-medium mb-2" style={{ color: C.textSoft }}>{t.notYet}</div>
          <button onClick={onGoToCheckin} className="text-sm font-semibold px-3 py-2 rounded-xl" style={{ background: C.purple, color: "#fff" }}>{t.goToCheckin}</button>
        </div>
      )}

      <div className="text-sm font-semibold mb-2" style={{ color: C.navy }}>{t.weeklyAverages}</div>
      {dailyQuestions.map(q => {
        const series = weeklyByQuestion[q] || [];
        const values = series.map(s => s.value);
        const labels = series.map((s, i) => (i === series.length - 1 ? "Now" : `Wk ${s.week}`));
        const headline = values.length < 2 ? null
          : values[values.length - 1] > values[0] ? t.upFrom(values[0], values[values.length - 1])
          : values[values.length - 1] < values[0] ? t.downFrom(values[0], values[values.length - 1])
          : t.steadyAt(values[values.length - 1]);
        return (
          <div key={q} className="rounded-xl p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="text-sm font-semibold mb-1" style={{ color: C.text }}>{QUESTION_LABEL[lang]?.[q] || q}</div>
            {values.length < 2 ? (
              <>
                <div className="text-lg font-bold mb-1" style={{ color: C.navy }}>{values[0] ?? "—"}</div>
                <p className="text-xs" style={{ color: C.textSoft }}>{t.startsAfter}</p>
              </>
            ) : (
              <>
                <div className="text-sm font-medium mb-1" style={{ color: C.text }}>{headline}</div>
                <LineChart name={QUESTION_LABEL[lang]?.[q] || q} values={values} weekLabels={labels} />
              </>
            )}
          </div>
        );
      })}

      <div className="text-sm font-semibold mb-2 mt-2" style={{ color: C.navy }}>{t.habitsTitle}</div>
      {!digestionInHabits ? (
        <p className="text-sm mb-3" style={{ color: C.textSoft }}>{t.addDigestion}</p>
      ) : habitRows.length === 0 ? (
        <p className="text-sm mb-3" style={{ color: C.textSoft }}>{t.addDigestion}</p>
      ) : (
        <div className="rounded-xl overflow-hidden mb-2" style={{ border: `1px solid ${C.line}` }}>
          {habitRows.map((h, i) => (
            <div key={h.habit_key} className="px-4 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
              <div className="text-sm font-medium mb-1" style={{ color: C.text }}>{lang === "es" ? h.habit?.text_es || h.habit?.text_en : h.habit?.text_en || h.habit_key}</div>
              <div className="text-xs" style={{ color: C.textSoft }}>
                {!h.ready ? t.doneSkipped(Math.min(h.days_done, 5), Math.min(h.days_skipped, 5))
                  : h.digestion_difference > 0.2 ? t.better(h.digestion_difference)
                  : h.digestion_difference < -0.2 ? t.worse(Math.abs(h.digestion_difference))
                  : t.noDiff}
              </div>
            </div>
          ))}
        </div>
      )}
      {(digestionInHabits && habitRows.length > 0) && <p className="text-xs mb-4" style={{ color: C.textSoft }}>{t.patternNote}</p>}

      <div className="text-sm font-semibold mb-2" style={{ color: C.navy }}>{t.howTracking}</div>
      <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-xs mb-2" style={{ color: C.textSoft }}>{t.dailyRow}</div>
        <div className="text-xs mb-2" style={{ color: C.textSoft }}>{t.phaseRow}</div>
        <div className="text-xs" style={{ color: C.textSoft }}>{t.chartsRow}</div>
      </div>
    </div>
  );
}
