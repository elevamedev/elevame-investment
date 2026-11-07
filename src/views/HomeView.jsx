import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../theme.js";
import { useV4Theme } from "../context/ThemeContext.jsx";
import { useFoodsData } from "../hooks/useFoodsData.js";
import { useV4Plan } from "../hooks/useV4Plan.js";
import { useV4Home } from "../hooks/useV4Home.js";
import StatusMark from "../components/v4/StatusMark.jsx";
import Sheet from "../components/v4/Sheet.jsx";
import MealSheetContent from "../components/v4/MealSheet.jsx";
import { useSheetParam } from "../hooks/useSheetParam.js";
import { useToast } from "../context/ToastContext.jsx";
import { supabase } from "../lib/supabaseClient.js";

const QUESTION_LABEL = {
  en: { digestion: "Digestion", bloating: "Bloating", energy: "Energy", sleep: "Sleep", mood: "Mood" },
  es: { digestion: "Digestión", bloating: "Hinchazón", energy: "Energía", sleep: "Sueño", mood: "Ánimo" },
};
const MILESTONE_LABEL = {
  en: { baseline: "Starting check-in", end_phase_1: "End of phase 1 check-in", end_phase_2: "End of phase 2 check-in", end_phase_3: "Final check-in" },
  es: { baseline: "Seguimiento inicial", end_phase_1: "Seguimiento de fin de fase 1", end_phase_2: "Seguimiento de fin de fase 2", end_phase_3: "Seguimiento final" },
};
const SNACK_OPTIONS = ["none", "one_two", "three_five", "six_plus"];
const SNACK_LABEL = {
  en: { none: "None", one_two: "1-2", three_five: "3-5", six_plus: "6+" },
  es: { none: "Ninguno", one_two: "1-2", three_five: "3-5", six_plus: "6+" },
};
const MILESTONE_FIELDS = ["digestion", "gas", "heaviness", "bowel_comfort", "energy", "sleep", "mood"];
const MILESTONE_FIELD_LABEL = {
  en: { digestion: "Digestion", gas: "Gas", heaviness: "How do you feel after meals?", bowel_comfort: "Bowel comfort", energy: "Energy", sleep: "Sleep", mood: "Mood" },
  es: { digestion: "Digestión", gas: "Gases", heaviness: "¿Cómo te sientes después de comer?", bowel_comfort: "Comodidad intestinal", energy: "Energía", sleep: "Sueño", mood: "Ánimo" },
};

const COPY = {
  en: {
    greetingMorning: "Good morning", greetingAfternoon: "Good afternoon", greetingEvening: "Good evening",
    checkinStreak: n => `${n} day${n === 1 ? "" : "s"} check in streak`,
    planDayLabel: "Plan day", thisWeekLabel: "This week", howYouFeelLabel: "How you feel", notYet: "Not yet",
    daysToGo: n => `${n} day${n === 1 ? "" : "s"} to go`,
    meals: n => `${n.meals_followed} of ${n.meals_planned}`,
    today: "Today", upNext: "Up next", seeMeal: "See meal", ateIt: "Ate it", allMealsLogged: "All meals logged for today.",
    loggedMeal: label => `Logged ${label}`, undo: "Undo",
    dailyCheckinTitle: "Today's check-in", saveCheckin: "Save", edit: "Edit", loggedCheckinLine: "Logged today's check-in",
    yourBodySystems: "Your body systems", editGoals: "Edit goals", reviewing: "Your nutritionist is reviewing your results.",
    yourGoal: "Your goal · ",
    comingUp: "Coming up", missed: "Missed", checkinPreview: "9 questions · about 2 minutes", start: "Start",
    loading: "Loading…", dailyHabitsThisWeek: "Daily habits this week",
    followGoal: "Follow this goal", dismissGoal: "Not now", noGoals: "No goals to review yet.",
    mealSheet: {
      eaten: "Eaten", ateIt: "Ate it", workedForMe: "Worked for me",
      swapFor: "Swap for a higher-scoring food", noHigherSwap: "Nothing in this group scores higher for you.",
      useAlways: "Use this swap every time", swapped: "Swapped", undo: "Undo",
      mealFooter: "Tap a food to see swaps. If a food doesn't agree with you, skip it whatever its score.",
    },
    phaseStatus: { done: "Done", now: "Now", next: "Starts" },
  },
  es: {
    greetingMorning: "Buenos días", greetingAfternoon: "Buenas tardes", greetingEvening: "Buenas noches",
    checkinStreak: n => `${n} día${n === 1 ? "" : "s"} seguidos de seguimiento`,
    planDayLabel: "Día del plan", thisWeekLabel: "Esta semana", howYouFeelLabel: "Cómo te sientes", notYet: "Aún no",
    daysToGo: n => `${n} día${n === 1 ? "" : "s"} restantes`,
    meals: n => `${n.meals_followed} de ${n.meals_planned}`,
    today: "Hoy", upNext: "A continuación", seeMeal: "Ver comida", ateIt: "Lo comí", allMealsLogged: "Todas las comidas registradas hoy.",
    loggedMeal: label => `Registrado: ${label}`, undo: "Deshacer",
    dailyCheckinTitle: "Seguimiento de hoy", saveCheckin: "Guardar", edit: "Editar", loggedCheckinLine: "Seguimiento de hoy registrado",
    yourBodySystems: "Tus sistemas corporales", editGoals: "Editar objetivos", reviewing: "Tu nutricionista está revisando tus resultados.",
    yourGoal: "Tu objetivo · ",
    comingUp: "Próximamente", missed: "Perdido", checkinPreview: "9 preguntas · unos 2 minutos", start: "Empezar",
    loading: "Cargando…", dailyHabitsThisWeek: "Hábitos diarios de esta semana",
    followGoal: "Seguir este objetivo", dismissGoal: "Ahora no", noGoals: "Aún no hay objetivos que revisar.",
    mealSheet: {
      eaten: "Comido", ateIt: "Lo comí", workedForMe: "Me funcionó",
      swapFor: "Sustituye por un alimento con mejor puntuación", noHigherSwap: "Nada en este grupo puntúa mejor para ti.",
      useAlways: "Usar esta sustitución siempre", swapped: "Sustituido", undo: "Deshacer",
      mealFooter: "Toca un alimento para ver sustituciones. Si un alimento no te sienta bien, omítelo sea cual sea su puntuación.",
    },
    phaseStatus: { done: "Hecho", now: "Ahora", next: "Empieza" },
  },
};

const SLOT_ORDER = ["breakfast", "lunch", "dinner", "snack"];

function Scale1to5({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(n)} aria-pressed={value === n}
          className="flex-1 py-2 rounded-lg text-sm font-semibold"
          style={{ background: value === n ? C.purple : C.bg, color: value === n ? "#fff" : C.textSoft }}>
          {n}
        </button>
      ))}
    </div>
  );
}

export default function HomeView({ lang, user, profile, goToSettings }) {
  const t = COPY[lang] || COPY.en;
  const { V } = useV4Theme();
  const navigate = useNavigate();
  const { show } = useToast();
  const { isOpen, open, close } = useSheetParam();
  const [editingCheckin, setEditingCheckin] = useState(false);
  const [checkinDraft, setCheckinDraft] = useState({});
  const [milestoneDraft, setMilestoneDraft] = useState({});

  const planDay = useMemo(() => {
    const start = new Date(profile?.plan_start_date || new Date().toISOString().slice(0, 10)); start.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.min(Math.max(Math.floor((today - start) / 86400000), 0), 41) + 1;
  }, [profile?.plan_start_date]);

  const foodsData = useFoodsData(user?.id, profile?.id);
  const plan = useV4Plan(profile?.id, foodsData.client?.id, planDay);
  const home = useV4Home(foodsData.client?.id, foodsData.testId, planDay, plan.phases);

  const foodsById = useMemo(() => Object.fromEntries(foodsData.foods.map(f => [f.id, f])), [foodsData.foods]);
  const scoreByFoodId = useMemo(() => Object.fromEntries(foodsData.foodScores.map(s => [s.food_id, s.score])), [foodsData.foodScores]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.greetingMorning : hour < 18 ? t.greetingAfternoon : t.greetingEvening;
  const firstName = (home.client?.preferred_name || home.client?.name || "").trim().split(/\s+/)[0] || "";
  const initials = firstName ? firstName[0].toUpperCase() : "·";

  const todaysFeelAverage = useMemo(() => {
    if (!home.todayCheckin) return null;
    const answered = home.dailyQuestions.filter(q => home.todayCheckin[q] != null);
    if (!answered.length) return null;
    return Math.round((answered.reduce((s, q) => s + home.todayCheckin[q], 0) / answered.length) * 10) / 10;
  }, [home.todayCheckin, home.dailyQuestions]);

  const currentWeek = Math.min(6, Math.max(1, Math.ceil(planDay / 7)));
  const weekRow = home.weeklyRows.find(w => w.week === currentWeek);
  const daysToGo = Math.max(0, 42 - planDay);

  const currentSlot = SLOT_ORDER[Math.min(3, hour < 11 ? 0 : hour < 16 ? 1 : hour < 21 ? 2 : 3)];
  const slotStartIdx = SLOT_ORDER.indexOf(currentSlot);
  const upNextMeal = useMemo(() => {
    for (let i = slotStartIdx; i < SLOT_ORDER.length; i++) {
      const m = plan.meals.find(m => m.label_key === SLOT_ORDER[i]);
      if (m && plan.mealLogs[m.id] !== "eaten") return m;
    }
    return null;
  }, [plan.meals, plan.mealLogs, slotStartIdx]);

  async function ateItNow(meal) {
    await plan.logMealEaten(meal.id);
    const label = lang === "es" ? (meal.dish_es || meal.dish_en) : meal.dish_en;
    show(t.loggedMeal(label), "success", {
      durationMs: 5000,
      action: { label: t.undo, onClick: () => supabase.from("meal_logs").delete().eq("client_id", foodsData.client?.id).eq("meal_id", meal.id).eq("day", plan.todayStr).then(() => plan.refetch()) },
    });
  }

  const dailyAnswered = !!home.todayCheckin;
  const showCheckinForm = !dailyAnswered || editingCheckin;

  function submitDailyCheckin() {
    home.saveDailyCheckin(checkinDraft);
    setEditingCheckin(false);
    setCheckinDraft({});
  }

  const statusesPresent = [...new Set(home.bodySystems.map(s => s.status))];

  const openMilestone = isOpen("checkin:milestone") && home.comingUpMilestone;
  function submitMilestone() {
    home.saveMilestoneCheckin(home.comingUpMilestone.key, milestoneDraft);
    setMilestoneDraft({});
    close();
  }

  const openMealSheet = plan.meals.find(m => isOpen(`meal:${m.id}`));

  if (foodsData.loading || plan.loading || home.loading) return <div className="px-4 pt-8 text-sm text-center" style={{ color: C.textSoft }}>{t.loading}</div>;

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          {home.checkinStreakDays > 0 && (
            <div className="text-[11px] font-semibold mb-1" style={{ color: V.purple }}>🔥 {t.checkinStreak(home.checkinStreakDays)}</div>
          )}
          <div className="text-lg font-bold" style={{ color: C.navy, fontFamily: "'Manrope', sans-serif" }}>
            {greeting}{firstName ? `, ${firstName}` : ""}
          </div>
        </div>
        <button onClick={goToSettings} aria-label="Settings" className="flex-none rounded-full flex items-center justify-center font-semibold text-sm"
          style={{ width: 38, height: 38, background: C.purpleSoft, color: C.purple }}>
          {initials}
        </button>
      </div>

      {/* Hero dials */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <button onClick={() => open("home:plan")} className="rounded-xl p-3 text-left" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-[10px] font-medium mb-1" style={{ color: C.textSoft }}>{t.planDayLabel}</div>
          <div className="text-lg font-bold" style={{ color: C.navy }}>{planDay}</div>
        </button>
        <button onClick={() => open("home:meals")} className="rounded-xl p-3 text-left" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-[10px] font-medium mb-1" style={{ color: C.textSoft }}>{t.thisWeekLabel}</div>
          <div className="text-lg font-bold" style={{ color: C.navy }}>{weekRow ? t.meals(weekRow) : "—"}</div>
        </button>
        <button onClick={() => open("home:feel")} className="rounded-xl p-3 text-left" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-[10px] font-medium mb-1" style={{ color: C.textSoft }}>{t.howYouFeelLabel}</div>
          <div className="text-lg font-bold" style={{ color: C.navy }}>
            {home.todayCheckin ? todaysFeelAverage : t.notYet}
          </div>
        </button>
      </div>
      {plan.phase && (
        <div className="text-xs mb-4" style={{ color: C.textSoft }}>
          {lang === "es" ? plan.phase.subtitle_es : plan.phase.subtitle_en} · {t.daysToGo(daysToGo)}
        </div>
      )}

      {/* Up next */}
      <div className="text-xs font-semibold mb-1.5" style={{ color: C.navy }}>{t.today}</div>
      {upNextMeal ? (
        <div className="rounded-xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-[11px] font-semibold uppercase mb-1" style={{ color: C.textSoft }}>{t.upNext}</div>
          <div className="text-sm font-semibold mb-3" style={{ color: C.text }}>{lang === "es" ? (upNextMeal.dish_es || upNextMeal.dish_en) : upNextMeal.dish_en}</div>
          <div className="flex gap-2">
            <button onClick={() => ateItNow(upNextMeal)} className="flex-1 text-sm font-semibold py-2.5 rounded-xl" style={{ background: C.purple, color: "#fff" }}>{t.ateIt}</button>
            <button onClick={() => open(`meal:${upNextMeal.id}`)} className="px-3.5 rounded-xl text-sm font-medium" style={{ border: `1px solid ${C.line}`, color: C.textSoft }}>{t.seeMeal}</button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-4 mb-4 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.textSoft }}>{t.allMealsLogged}</div>
      )}

      {/* Daily check-in */}
      <div className="rounded-xl p-4 mb-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        {showCheckinForm ? (
          <>
            <div className="text-sm font-semibold mb-3" style={{ color: C.text }}>{t.dailyCheckinTitle}</div>
            {home.dailyQuestions.map(q => (
              <div key={q} className="mb-3">
                <div className="text-xs mb-1.5" style={{ color: C.textSoft }}>{QUESTION_LABEL[lang]?.[q] || q}</div>
                <Scale1to5 value={checkinDraft[q] ?? home.todayCheckin?.[q]} onChange={v => setCheckinDraft(d => ({ ...d, [q]: v }))} />
              </div>
            ))}
            <button onClick={submitDailyCheckin} className="w-full text-sm font-semibold py-2.5 rounded-xl" style={{ background: C.purple, color: "#fff" }}>{t.saveCheckin}</button>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: C.text }}>{t.loggedCheckinLine}</span>
            <button onClick={() => setEditingCheckin(true)} className="text-sm font-semibold" style={{ color: C.purple }}>{t.edit}</button>
          </div>
        )}
      </div>

      {/* Body systems */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold" style={{ color: C.navy }}>{t.yourBodySystems}</span>
        <button onClick={() => open("home:goals")} className="text-xs font-semibold" style={{ color: C.purple }}>{t.editGoals}</button>
      </div>
      {statusesPresent.length > 0 && (
        <div className="flex items-center gap-3 mb-2">
          {statusesPresent.map(s => (
            <span key={s} className="flex items-center gap-1 text-[11px]" style={{ color: C.textSoft }}>
              <StatusMark status={s} lang={lang} size={8} />
              {s === "act" ? "Needs support" : s === "watch" ? "Could be better" : "Good"}
            </span>
          ))}
        </div>
      )}
      {home.bodySystems.length === 0 ? (
        <div className="rounded-xl p-4 mb-5 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.textSoft }}>{t.reviewing}</div>
      ) : (
        <div className="rounded-xl overflow-hidden mb-5" style={{ border: `1px solid ${C.line}` }}>
          {home.bodySystems.map((s, i) => (
            <button key={s.themeId} onClick={() => navigate(`/system/${s.themeId}`)} className="w-full flex items-center gap-3 px-4 py-3 text-left"
              style={{ background: C.card, borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
              <div className="flex-none rounded-lg overflow-hidden" style={{ width: 44, height: 44, background: C.bg }}>
                {s.image?.image_url && <img src={s.image.image_url} alt={lang === "es" ? s.image.image_alt_es : s.image.image_alt_en} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: C.text }}>{lang === "es" ? s.name?.name_es : s.name?.name_en}</div>
                <div className="text-xs truncate" style={{ color: C.textSoft }}>{s.followed && t.yourGoal}{lang === "es" ? (s.lineEs || s.lineEn) : s.lineEn}</div>
              </div>
              <StatusMark status={s.status} lang={lang} size={9} />
            </button>
          ))}
        </div>
      )}

      {/* Coming up */}
      {home.comingUpMilestone && (
        <>
          <div className="text-xs font-semibold mb-1.5" style={{ color: C.navy }}>{t.comingUp}</div>
          <button onClick={() => open("checkin:milestone")} className="w-full text-left rounded-xl p-4 mb-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold" style={{ color: C.text }}>{MILESTONE_LABEL[lang]?.[home.comingUpMilestone.key]}</span>
              {home.comingUpMilestone.state === "missed" && <span className="text-[11px] font-semibold" style={{ color: V.re }}>{t.missed}</span>}
            </div>
            <div className="text-xs" style={{ color: C.textSoft }}>{t.checkinPreview}</div>
          </button>
        </>
      )}

      {/* Sheets */}
      <Sheet open={isOpen("home:plan")} onClose={close} title={t.planDayLabel}>
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
          {plan.phases.map((p, i) => {
            const status = p.id === plan.phase?.id ? "now" : (p.start_day <= planDay ? "done" : "next");
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: C.text }}>{lang === "es" ? p.subtitle_es : p.subtitle_en}</div>
                  <div className="text-xs" style={{ color: C.textSoft }}>{lang === "es" ? p.weeks_es : p.weeks_en}</div>
                </div>
                <span className="text-xs font-medium" style={{ color: C.textSoft }}>{t.phaseStatus[status]}</span>
              </div>
            );
          })}
        </div>
        {plan.phase && <p className="text-xs mt-3" style={{ color: C.textSoft }}>{lang === "es" ? plan.phase.blurb_es : plan.phase.blurb_en}</p>}
      </Sheet>

      <Sheet open={isOpen("home:meals")} onClose={close} title={t.thisWeekLabel}>
        <div className="rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${C.line}` }}>
          {home.weeklyRows.filter(w => w.week <= currentWeek).map((w, i) => (
            <div key={w.week} className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
              <span className="text-sm" style={{ color: C.text }}>Week {w.week}</span>
              <span className="text-sm font-semibold" style={{ color: C.text }}>{t.meals(w)}</span>
            </div>
          ))}
        </div>
        <div className="text-xs font-semibold mb-1.5" style={{ color: C.navy }}>{t.dailyHabitsThisWeek}</div>
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
          {plan.habits.map((h, i) => (
            <div key={h.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
              <span className="text-sm" style={{ color: C.text }}>{lang === "es" ? h.text_es : h.text_en}</span>
              <span className="text-xs font-medium" style={{ color: plan.habitStreaks[h.id] ? V.good : C.textSoft }}>
                {plan.habitStreaks[h.id] ? `${plan.habitStreaks[h.id]}🔥` : "—"}
              </span>
            </div>
          ))}
        </div>
      </Sheet>

      <Sheet open={isOpen("home:feel")} onClose={close} title={t.howYouFeelLabel}>
        {home.todayCheckin ? (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
            {home.dailyQuestions.filter(q => home.todayCheckin[q] != null).map((q, i) => (
              <div key={q} className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                <span className="text-sm" style={{ color: C.text }}>{QUESTION_LABEL[lang]?.[q] || q}</span>
                <span className="text-sm font-semibold" style={{ color: C.text }}>{home.todayCheckin[q]} / 5</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm" style={{ color: C.textSoft }}>{t.notYet}</p>}
      </Sheet>

      <Sheet open={isOpen("home:goals")} onClose={close} title={t.editGoals}>
        {Object.keys(home.goalKeyFollowed).length === 0 ? (
          <p className="text-sm" style={{ color: C.textSoft }}>{t.noGoals}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {Object.entries(home.goalKeyFollowed).map(([key, followed]) => (
              <div key={key} className="rounded-xl p-3 flex items-center justify-between" style={{ border: `1px solid ${C.line}` }}>
                <span className="text-sm" style={{ color: C.text }}>{key}</span>
                {followed ? (
                  <span className="text-xs font-semibold" style={{ color: V.good }}>✓</span>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={async () => { await supabase.from("client_goals").update({ confirmed_at: new Date().toISOString() }).eq("client_id", foodsData.client?.id).eq("goal_key", key); home.refetch(); }}
                      className="text-xs font-semibold" style={{ color: C.purple }}>{t.followGoal}</button>
                    <button onClick={async () => { await supabase.from("client_goals").update({ status: "dismissed" }).eq("client_id", foodsData.client?.id).eq("goal_key", key); home.refetch(); }}
                      className="text-xs" style={{ color: C.textSoft }}>{t.dismissGoal}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Sheet>

      {openMilestone && (
        <Sheet open={!!openMilestone} onClose={close} title={MILESTONE_LABEL[lang]?.[home.comingUpMilestone.key]}>
          {MILESTONE_FIELDS.map(f => (
            <div key={f} className="mb-3">
              <div className="text-xs mb-1.5" style={{ color: C.textSoft }}>{MILESTONE_FIELD_LABEL[lang]?.[f] || f}</div>
              <Scale1to5 value={milestoneDraft[f]} onChange={v => setMilestoneDraft(d => ({ ...d, [f]: v }))} />
            </div>
          ))}
          <div className="mb-3">
            <div className="text-xs mb-1.5" style={{ color: C.textSoft }}>Processed snacks</div>
            <div className="flex gap-1.5">
              {SNACK_OPTIONS.map(opt => (
                <button key={opt} onClick={() => setMilestoneDraft(d => ({ ...d, processed_snacks: opt }))} aria-pressed={milestoneDraft.processed_snacks === opt}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: milestoneDraft.processed_snacks === opt ? C.purple : C.bg, color: milestoneDraft.processed_snacks === opt ? "#fff" : C.textSoft }}>
                  {SNACK_LABEL[lang]?.[opt]}
                </button>
              ))}
            </div>
          </div>
          <textarea value={milestoneDraft.notes || ""} onChange={e => setMilestoneDraft(d => ({ ...d, notes: e.target.value }))}
            placeholder={lang === "es" ? "Algo más que hayas notado…" : "Anything else you've noticed…"}
            className="w-full text-sm rounded-lg px-3 py-2 mb-3" style={{ border: `1px solid ${C.line}`, minHeight: 70 }} />
          <button onClick={submitMilestone} className="w-full text-sm font-semibold py-2.5 rounded-xl" style={{ background: C.purple, color: "#fff" }}>{t.start}</button>
        </Sheet>
      )}

      {openMealSheet && (
        <Sheet open={!!openMealSheet} onClose={close} title={lang === "es" ? openMealSheet.dish_es : openMealSheet.dish_en}>
          <MealSheetContent meal={openMealSheet} items={plan.itemsByMeal[openMealSheet.id] || []} foodsById={foodsById}
            scoreByFoodId={scoreByFoodId} flagsByFoodId={foodsData.flagsByFoodId} excludedFoodIds={foodsData.excludedFoodIds}
            foods={foodsData.foods} plan={plan} t={t.mealSheet} lang={lang} />
        </Sheet>
      )}
    </div>
  );
}
