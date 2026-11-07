import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useC } from "../theme.js";
import { useFoodsData } from "../hooks/useFoodsData.js";
import { useV4Checkin, CHECKIN_FIELDS } from "../hooks/useV4Checkin.js";

const SCALE_FIELDS = ["digestion", "gas", "heaviness", "bowel_comfort", "energy", "sleep", "mood"];
const SNACK_OPTIONS = ["none", "one_two", "three_five", "six_plus"];

const QUESTION_LABEL = {
  en: { digestion: "Digestion", gas: "Gas", heaviness: "How do you feel after meals?", bowel_comfort: "Bowel comfort", energy: "Energy", sleep: "Sleep", mood: "Mood", processed_snacks: "Processed snacks this week", notes: "Anything else you've noticed?" },
  es: { digestion: "Digestión", gas: "Gases", heaviness: "¿Cómo te sientes después de comer?", bowel_comfort: "Comodidad intestinal", energy: "Energía", sleep: "Sueño", mood: "Ánimo", processed_snacks: "Snacks procesados esta semana", notes: "¿Algo más que hayas notado?" },
};
const SNACK_LABEL = {
  en: { none: "None", one_two: "1 or 2", three_five: "3 to 5", six_plus: "6 or more" },
  es: { none: "Ninguno", one_two: "1 o 2", three_five: "3 a 5", six_plus: "6 o más" },
};
const MILESTONE_TITLE = {
  en: { baseline: "Starting check-in", end_phase_1: "End of phase 1 check-in", end_phase_2: "End of phase 2 check-in", end_phase_3: "Final check-in" },
  es: { baseline: "Seguimiento inicial", end_phase_1: "Seguimiento de fin de fase 1", end_phase_2: "Seguimiento de fin de fase 2", end_phase_3: "Seguimiento final" },
};

const COPY = {
  en: {
    of: (n, total) => `${n} of ${total}`, next: "Next", back: "Back", finish: "Finish",
    leaveConfirm: "Leave? Your answers are kept.", notesHint: "Your nutritionist can read this.",
    opens: date => `Opens ${date}`, preview: "Preview",
    better: "Better", same: "Same", harder: "Harder", sinceYouStarted: "Since you started",
    baselineSaved: "Your starting point is saved.", noBaseline: "Your first phase check in sets your starting point.",
    done: "Done", loading: "Loading…",
  },
  es: {
    of: (n, total) => `${n} de ${total}`, next: "Siguiente", back: "Atrás", finish: "Terminar",
    leaveConfirm: "¿Salir? Tus respuestas se guardan.", notesHint: "Tu nutricionista puede leer esto.",
    opens: date => `Se abre el ${date}`, preview: "Vista previa",
    better: "Mejor", same: "Igual", harder: "Peor", sinceYouStarted: "Desde que empezaste",
    baselineSaved: "Tu punto de partida está guardado.", noBaseline: "Tu primer seguimiento de fase fija tu punto de partida.",
    done: "Listo", loading: "Cargando…",
  },
};

function Scale1to5({ value, onChange }) {
  const C = useC();
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(n)} aria-pressed={value === n}
          className="flex-1 py-4 rounded-xl text-lg font-semibold"
          style={{ background: value === n ? C.purple : C.bg, color: value === n ? "#fff" : C.textSoft }}>
          {n}
        </button>
      ))}
    </div>
  );
}

export default function CheckinFlowView({ lang, user, profile }) {
  const t = COPY[lang] || COPY.en;
  const C = useC();
  const navigate = useNavigate();
  const { milestone } = useParams();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const foodsData = useFoodsData(user?.id, profile?.id);
  const checkin = useV4Checkin(foodsData.client?.id, profile?.id, profile?.plan_start_date, milestone);

  const draftKey = `elevame_checkin_draft_${milestone}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || "null");
      if (saved) setDraft(saved);
    } catch { /* ignore a corrupt or missing draft */ }
  }, [draftKey]);
  useEffect(() => {
    if (checkin.existing && Object.keys(draft).length === 0) {
      setDraft(Object.fromEntries(CHECKIN_FIELDS.filter(f => checkin.existing[f] != null).map(f => [f, checkin.existing[f]])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkin.existing]);

  function setField(field, value) {
    setDraft(d => {
      const next = { ...d, [field]: value };
      try { localStorage.setItem(draftKey, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  }

  function handleBack() {
    if (step === 0) {
      if (Object.keys(draft).length === 0 || window.confirm(t.leaveConfirm)) navigate("/");
      return;
    }
    setStep(s => s - 1);
  }

  async function handleNext() {
    if (step < CHECKIN_FIELDS.length - 1) { setStep(s => s + 1); return; }
    await checkin.submit(draft, foodsData.testId);
    try { localStorage.removeItem(draftKey); } catch { /* storage unavailable */ }
    setSubmitted(true);
  }

  if (foodsData.loading || checkin.loading) return <div className="px-4 pt-8 text-sm text-center" style={{ color: C.textSoft }}>{t.loading}</div>;

  if (!checkin.isOpen) {
    const openDate = new Date(profile?.plan_start_date || new Date());
    openDate.setDate(openDate.getDate() + (checkin.dueDay - 1));
    return (
      <div className="px-4 pt-4 pb-10 max-w-md mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color: C.textSoft }}>
          <ChevronLeft size={16} /> {t.back}
        </button>
        <h1 className="text-lg font-bold mb-1" style={{ color: C.navy, fontFamily: "'Manrope', sans-serif" }}>{MILESTONE_TITLE[lang]?.[milestone]}</h1>
        <div className="text-xs font-semibold mb-4" style={{ color: C.textSoft }}>{t.preview}</div>
        <div className="rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${C.line}` }}>
          {CHECKIN_FIELDS.map((f, i) => (
            <div key={f} className="px-4 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
              <span className="text-sm" style={{ color: C.text }}>{QUESTION_LABEL[lang]?.[f]}</span>
            </div>
          ))}
        </div>
        <div className="text-sm font-medium text-center" style={{ color: C.textSoft }}>{t.opens(openDate.toLocaleDateString(lang === "es" ? "es-ES" : "en-US"))}</div>
      </div>
    );
  }

  if (submitted) {
    const isBaseline = milestone === "baseline";
    const since = isBaseline ? null
      : checkin.baselineDigestion == null ? "none"
      : draft.digestion > checkin.baselineDigestion ? "better"
      : draft.digestion < checkin.baselineDigestion ? "harder"
      : "same";
    return (
      <div className="px-4 pt-10 pb-10 max-w-md mx-auto text-center">
        <h1 className="text-lg font-bold mb-2" style={{ color: C.navy, fontFamily: "'Manrope', sans-serif" }}>{t.sinceYouStarted}</h1>
        {isBaseline ? (
          <p className="text-sm mb-6" style={{ color: C.textSoft }}>{t.baselineSaved}</p>
        ) : since === "none" ? (
          <p className="text-sm mb-6" style={{ color: C.textSoft }}>{t.noBaseline}</p>
        ) : (
          <p className="text-2xl font-bold mb-6" style={{ color: C.navy }}>{since === "better" ? t.better : since === "harder" ? t.harder : t.same}</p>
        )}
        <button onClick={() => navigate("/")} className="w-full text-sm font-semibold py-2.5 rounded-xl" style={{ background: C.purple, color: "#fff" }}>{t.done}</button>
      </div>
    );
  }

  const field = CHECKIN_FIELDS[step];
  const isLast = step === CHECKIN_FIELDS.length - 1;
  const canProceed = isLast || draft[field] != null;

  return (
    <div className="px-4 pt-4 pb-10 max-w-md mx-auto flex flex-col" style={{ minHeight: "100vh" }}>
      <div className="flex items-center justify-between mb-6">
        <button onClick={handleBack} aria-label={t.back} className="p-1 -ml-1"><ChevronLeft size={22} color={C.text} /></button>
        <span className="text-xs font-medium" style={{ color: C.textSoft }}>{t.of(step + 1, CHECKIN_FIELDS.length)}</span>
      </div>

      <div className="flex-1">
        <h2 className="text-lg font-semibold mb-6" style={{ color: C.navy, fontFamily: "'Manrope', sans-serif" }}>{QUESTION_LABEL[lang]?.[field]}</h2>

        {SCALE_FIELDS.includes(field) && <Scale1to5 value={draft[field]} onChange={v => setField(field, v)} />}

        {field === "processed_snacks" && (
          <div className="flex flex-col gap-2">
            {SNACK_OPTIONS.map(opt => (
              <button key={opt} onClick={() => setField(field, opt)} aria-pressed={draft.processed_snacks === opt}
                className="w-full text-left py-3 px-4 rounded-xl text-sm font-medium"
                style={{ background: draft.processed_snacks === opt ? C.purple : C.bg, color: draft.processed_snacks === opt ? "#fff" : C.text }}>
                {SNACK_LABEL[lang]?.[opt]}
              </button>
            ))}
          </div>
        )}

        {field === "notes" && (
          <>
            <textarea value={draft.notes || ""} onChange={e => setField("notes", e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-3" style={{ border: `1px solid ${C.line}`, minHeight: 120 }} />
            <p className="text-xs mt-2" style={{ color: C.textSoft }}>{t.notesHint}</p>
          </>
        )}
      </div>

      <button onClick={handleNext} disabled={!canProceed}
        className="w-full text-sm font-semibold py-3 rounded-xl mt-6" style={{ background: canProceed ? C.purple : C.purpleSoft, color: canProceed ? "#fff" : C.purpleText }}>
        {isLast ? t.finish : t.next}
      </button>
    </div>
  );
}
