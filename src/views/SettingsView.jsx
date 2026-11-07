import { useState } from "react";
import { ChevronRight, LogOut } from "lucide-react";
import { useC } from "../theme.js";
import { useToast } from "../context/ToastContext.jsx";
import { useV4Settings } from "../hooks/useV4Settings.js";
import { useV4Consent } from "../hooks/useV4Consent.js";
import Sheet from "../components/v4/Sheet.jsx";
import PrivacyNoticeView from "./PrivacyNoticeView.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { isoDate } from "../lib/localDate.js";

const ES_RELEASED = import.meta.env.VITE_ES_RELEASED === "true";
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || "support@elevame.es";
const BASE_DAILY_QUESTIONS = ["digestion", "bloating", "energy", "sleep", "mood"];

const COPY = {
  en: {
    title: "Settings",
    lookAndLanguage: "Look and language",
    language: "Language",
    appearance: "Appearance", light: "Light", dark: "Dark",
    textSize: "Text size", standard: "Standard", large: "Large",
    reminders: "Reminders",
    mealReminders: "Meal reminders", mealRemindersSub: "A nudge before lunch and dinner",
    dailyReminder: "Daily check in", dailyReminderSub: "A reminder to log how you felt today",
    phaseCheckinReminders: "Phase check ins", phaseCheckinRemindersSub: "When a check in opens",
    weeklySummary: "Weekly summary", weeklySummarySub: "Sunday morning: meals, habits and how you felt",
    shoppingReminder: "Shopping day", shoppingReminderSub: "The day before your new plan week starts",
    myPlan: "My plan",
    dailyQuestions: "Daily check in questions", chooseUpTo: "Choose up to 4",
    removeToAdd: label => `Remove a question to add ${label}.`,
    foodRules: "Food rules", foodRulesSub: "Set with your nutritionist",
    foodRulesEmpty: "No food rules on file.",
    portions: "Show portions in my meals", portionsSub: "Needs a weight goal and your nutritionist's OK",
    portionsApproved: "Approved by your nutritionist.", portionsPending: "Waiting on your nutritionist's OK.",
    yourData: "Your data",
    share: "Share my progress with my nutritionist", shareSub: "Meals, habits and check ins",
    download: "Download my data", downloaded: "Your data has been saved to your device.",
    privacyAndConsent: "Privacy and consent",
    deleteAccount: "Delete my account",
    help: "Help",
    messageNutritionist: "Message my nutritionist",
    helpRow: "Help",
    signOut: "Sign out",
    questionLabel: { digestion: "Digestion", bloating: "Bloating", energy: "Energy", sleep: "Sleep", mood: "Mood" },
    // Privacy and consent sheet
    consentGivenOn: date => `Agreed on ${date}`,
    withdraw: "Withdraw consent",
    withdrawConfirm: "Without this, the app can't show your health results, and your nutritionist will be told. Withdraw anyway?",
    // Delete account sheet
    deleteTitle: "Delete my account",
    deleteExplain: "This permanently deletes your account and everything in it: your results, check ins, notes, meals, habits and settings. This can't be undone.",
    deleteTypePrompt: "Type DELETE to confirm.",
    deleteConfirmButton: "Delete my account",
    deleting: "Deleting…",
    deleteError: "Something went wrong. Please try again or message your nutritionist.",
  },
  es: {
    title: "Ajustes",
    lookAndLanguage: "Aspecto e idioma",
    language: "Idioma",
    appearance: "Apariencia", light: "Claro", dark: "Oscuro",
    textSize: "Tamaño del texto", standard: "Estándar", large: "Grande",
    reminders: "Recordatorios",
    mealReminders: "Recordatorios de comidas", mealRemindersSub: "Un aviso antes de comer y cenar",
    dailyReminder: "Seguimiento diario", dailyReminderSub: "Un recordatorio para registrar cómo te sentiste hoy",
    phaseCheckinReminders: "Seguimientos de fase", phaseCheckinRemindersSub: "Cuando se abre un seguimiento",
    weeklySummary: "Resumen semanal", weeklySummarySub: "Domingo por la mañana: comidas, hábitos y cómo te sentiste",
    shoppingReminder: "Día de compra", shoppingReminderSub: "El día antes de que empiece tu nueva semana de plan",
    myPlan: "Mi plan",
    dailyQuestions: "Preguntas del seguimiento diario", chooseUpTo: "Elige hasta 4",
    removeToAdd: label => `Quita una pregunta para añadir ${label}.`,
    foodRules: "Reglas de alimentos", foodRulesSub: "Fijadas con tu nutricionista",
    foodRulesEmpty: "No hay reglas de alimentos registradas.",
    portions: "Mostrar raciones en mis comidas", portionsSub: "Necesita un objetivo de peso y el visto bueno de tu nutricionista",
    portionsApproved: "Aprobado por tu nutricionista.", portionsPending: "Esperando el visto bueno de tu nutricionista.",
    yourData: "Tus datos",
    share: "Compartir mi progreso con mi nutricionista", shareSub: "Comidas, hábitos y seguimientos",
    download: "Descargar mis datos", downloaded: "Tus datos se han guardado en tu dispositivo.",
    privacyAndConsent: "Privacidad y consentimiento",
    deleteAccount: "Eliminar mi cuenta",
    help: "Ayuda",
    messageNutritionist: "Mensaje a mi nutricionista",
    helpRow: "Ayuda",
    signOut: "Cerrar sesión",
    questionLabel: { digestion: "Digestión", bloating: "Hinchazón", energy: "Energía", sleep: "Sueño", mood: "Ánimo" },
    consentGivenOn: date => `Aceptado el ${date}`,
    withdraw: "Retirar consentimiento",
    withdrawConfirm: "Sin esto, la app no puede mostrar tus resultados de salud, y se avisará a tu nutricionista. ¿Retirar de todos modos?",
    deleteTitle: "Eliminar mi cuenta",
    deleteExplain: "Esto elimina tu cuenta de forma permanente, junto con todo su contenido: tus resultados, seguimientos, notas, comidas, hábitos y ajustes. No se puede deshacer.",
    deleteTypePrompt: "Escribe DELETE para confirmar.",
    deleteConfirmButton: "Eliminar mi cuenta",
    deleting: "Eliminando…",
    deleteError: "Algo salió mal. Inténtalo de nuevo o escribe a tu nutricionista.",
  },
};

function Section({ title, children }) {
  const C = useC();
  return (
    <>
      <div className="text-xs font-semibold uppercase tracking-wide mt-5 mb-2" style={{ color: C.textSoft }}>{title}</div>
      <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>{children}</div>
    </>
  );
}

function Row({ children, border = true }) {
  const C = useC();
  return <div className="px-4 py-3 flex items-center gap-3" style={{ borderTop: border ? `1px solid ${C.line}` : "none", minHeight: 44 }}>{children}</div>;
}

function NavRow({ label, sub, onClick, danger, border = true }) {
  const C = useC();
  return (
    <button onClick={onClick} className="w-full px-4 py-3 flex items-center gap-3 text-left" style={{ borderTop: border ? `1px solid ${C.line}` : "none", minHeight: 44 }}>
      <span className="flex-1">
        <div className="text-sm font-medium" style={{ color: danger ? C.redText : C.text }}>{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: C.textSoft }}>{sub}</div>}
      </span>
      <ChevronRight size={18} color={C.textSoft} />
    </button>
  );
}

function Switch({ checked, onChange, label }) {
  const C = useC();
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      style={{ width: 44, height: 26, borderRadius: 13, background: checked ? C.purple : C.line, position: "relative", flex: "none" }}>
      <span style={{
        position: "absolute", top: 2, left: checked ? 20 : 2, width: 22, height: 22, borderRadius: 11,
        background: "#fff", transition: "left .15s", boxShadow: "0 1px 2px rgba(0,0,0,.2)",
      }} />
    </button>
  );
}

function ToggleRow({ label, sub, checked, onChange, border = true }) {
  const C = useC();
  return (
    <Row border={border}>
      <span className="flex-1">
        <div className="text-sm font-medium" style={{ color: C.text }}>{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: C.textSoft }}>{sub}</div>}
      </span>
      <Switch checked={checked} onChange={onChange} label={label} />
    </Row>
  );
}

function Seg({ options, value, onChange }) {
  const C = useC();
  return (
    <div className="flex gap-1">
      {options.map(([key, label]) => (
        <button key={key} onClick={() => onChange(key)} aria-pressed={value === key}
          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full"
          style={{ background: value === key ? C.purple : C.card, color: value === key ? "#fff" : C.textSoft, border: `1px solid ${value === key ? C.purple : C.line}` }}>
          {label}
        </button>
      ))}
    </div>
  );
}

function PrivacySheet({ open, onClose, lang, t, consent }) {
  const C = useC();
  const date = consent.givenAt ? new Date(consent.givenAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US") : null;
  const [confirming, setConfirming] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} title={t.privacyAndConsent}>
      <div className="text-lg font-bold mb-3" style={{ color: C.navy }}>{t.privacyAndConsent}</div>
      {date && <div className="text-sm font-medium mb-4" style={{ color: C.text }}>{t.consentGivenOn(date)}</div>}
      <PrivacyNoticeView lang={lang} />
      {!confirming ? (
        <button onClick={() => setConfirming(true)} className="w-full text-sm font-semibold py-3 rounded-xl mt-2" style={{ background: C.card, border: `1px solid ${C.red}`, color: C.redText }}>
          {t.withdraw}
        </button>
      ) : (
        <div className="rounded-xl p-3 mt-2" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
          <div className="text-sm mb-3" style={{ color: C.text }}>{t.withdrawConfirm}</div>
          <div className="flex gap-2">
            <button onClick={() => setConfirming(false)} className="flex-1 text-sm font-semibold py-2 rounded-xl" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.text }}>
              {lang === "es" ? "Cancelar" : "Cancel"}
            </button>
            <button onClick={consent.withdrawConsent} className="flex-1 text-sm font-semibold py-2 rounded-xl" style={{ background: C.red, color: "#fff" }}>
              {t.withdraw}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function DeleteAccountSheet({ open, onClose, t, onSignOut }) {
  const C = useC();
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState("idle"); // idle | deleting | error
  const { show } = useToast();

  async function handleDelete() {
    setStatus("deleting");
    const { error } = await supabase.functions.invoke("delete-account");
    if (error) { setStatus("error"); show(t.deleteError, "error"); return; }
    await onSignOut();
  }

  return (
    <Sheet open={open} onClose={onClose} title={t.deleteTitle}>
      <div className="text-lg font-bold mb-3" style={{ color: C.navy }}>{t.deleteTitle}</div>
      <p className="text-sm mb-4" style={{ color: C.text }}>{t.deleteExplain}</p>
      <p className="text-sm font-medium mb-2" style={{ color: C.text }}>{t.deleteTypePrompt}</p>
      <input value={typed} onChange={e => setTyped(e.target.value)} className="w-full text-sm rounded-xl px-3 py-3 mb-4"
        style={{ border: `1px solid ${C.line}` }} autoComplete="off" />
      <button onClick={handleDelete} disabled={typed !== "DELETE" || status === "deleting"}
        className="w-full text-sm font-semibold py-3 rounded-xl"
        style={{ background: typed === "DELETE" ? C.red : C.card, color: typed === "DELETE" ? "#fff" : C.textSoft, border: `1px solid ${typed === "DELETE" ? C.red : C.line}` }}>
        {status === "deleting" ? t.deleting : t.deleteConfirmButton}
      </button>
    </Sheet>
  );
}

export default function SettingsView({ lang, user, profile, setLang, onSignOut }) {
  const t = COPY[lang] || COPY.en;
  const C = useC();
  const { show } = useToast();
  const settingsData = useV4Settings(user?.id);
  const consent = useV4Consent(user?.id);
  const { settings } = settingsData;
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [foodRulesOpen, setFoodRulesOpen] = useState(false);

  // Brief 4.11: own goals that track a measure should add chips here too.
  // client_settings.daily_questions only accepts these 5 values (DB check
  // constraint) and every tracked_by in today's goal_catalog either is one
  // of them already or isn't a valid daily question (weight, snacks) — so
  // there's never a distinct chip to add under the current catalog.
  const questionOptions = BASE_DAILY_QUESTIONS.map(key => ({ key, label: t.questionLabel[key] }));

  function toggleQuestion(key) {
    const current = settings?.daily_questions || [];
    if (current.includes(key)) {
      if (current.length === 1) return; // always at least one
      settingsData.updateSettings({ daily_questions: current.filter(k => k !== key) });
    } else {
      if (current.length >= 4) { show(t.removeToAdd(t.questionLabel[key] || key), "info"); return; }
      settingsData.updateSettings({ daily_questions: [...current, key] });
    }
  }

  async function handleDownload() {
    try {
      const data = await settingsData.exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = isoDate(new Date());
      a.href = url; a.download = `elevame-data-${date}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      show(t.downloaded, "info");
    } catch {
      show(t.deleteError, "error");
    }
  }

  async function handleWithdrawThenSignOut() {
    await consent.withdrawConsent();
    await onSignOut();
  }

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="text-lg font-extrabold mb-4" style={{ color: C.navy }}>{t.title}</div>

      <div className="rounded-xl p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-sm font-semibold mb-1" style={{ color: C.text }}>{profile?.full_name}</div>
        <div className="text-xs" style={{ color: C.textSoft }}>
          {profile?.kit_code}
          {settingsData.nutritionist?.display_name ? ` · ${lang === "es" ? "Tu nutricionista" : "Your nutritionist"}: ${settingsData.nutritionist.display_name}` : ""}
        </div>
      </div>

      <Section title={t.lookAndLanguage}>
        {ES_RELEASED && (
          <Row border={false}>
            <span className="flex-1 text-sm font-medium" style={{ color: C.text }}>{t.language}</span>
            <Seg value={lang} onChange={setLang} options={[["en", "EN"], ["es", "ES"]]} />
          </Row>
        )}
        <Row border={ES_RELEASED}>
          <span className="flex-1 text-sm font-medium" style={{ color: C.text }}>{t.appearance}</span>
          <Seg value={settings?.theme === "dark" ? "dark" : "light"} onChange={v => settingsData.updateSettings({ theme: v })}
            options={[["light", t.light], ["dark", t.dark]]} />
        </Row>
        <Row>
          <span className="flex-1 text-sm font-medium" style={{ color: C.text }}>{t.textSize}</span>
          <Seg value={settings?.text_size === "large" ? "large" : "standard"} onChange={v => settingsData.updateSettings({ text_size: v })}
            options={[["standard", t.standard], ["large", t.large]]} />
        </Row>
      </Section>

      <Section title={t.reminders}>
        <ToggleRow border={false} label={t.mealReminders} sub={t.mealRemindersSub} checked={!!settings?.meal_reminders} onChange={v => settingsData.updateSettings({ meal_reminders: v })} />
        <ToggleRow label={t.dailyReminder} sub={t.dailyReminderSub} checked={!!settings?.daily_reminder} onChange={v => settingsData.updateSettings({ daily_reminder: v })} />
        <ToggleRow label={t.phaseCheckinReminders} sub={t.phaseCheckinRemindersSub} checked={!!settings?.phase_checkin_reminders} onChange={v => settingsData.updateSettings({ phase_checkin_reminders: v })} />
        <ToggleRow label={t.weeklySummary} sub={t.weeklySummarySub} checked={!!settings?.weekly_summary} onChange={v => settingsData.updateSettings({ weekly_summary: v })} />
        <ToggleRow label={t.shoppingReminder} sub={t.shoppingReminderSub} checked={!!settings?.shopping_reminder} onChange={v => settingsData.updateSettings({ shopping_reminder: v })} />
      </Section>

      <Section title={t.myPlan}>
        <div className="px-4 py-3">
          <div className="text-sm font-medium mb-1" style={{ color: C.text }}>{t.dailyQuestions}</div>
          <div className="text-xs mb-2" style={{ color: C.textSoft }}>{t.chooseUpTo}</div>
          <div className="flex flex-wrap gap-1.5">
            {questionOptions.map(({ key, label }) => {
              const selected = (settings?.daily_questions || []).includes(key);
              const disabled = selected && (settings?.daily_questions || []).length === 1;
              return (
                <button key={key} disabled={disabled} onClick={() => toggleQuestion(key)} aria-pressed={selected}
                  className="text-xs font-semibold px-3 py-2 rounded-full" style={{
                    background: selected ? C.purple : C.card, color: selected ? "#fff" : C.textSoft,
                    border: `1px solid ${selected ? C.purple : C.line}`, opacity: disabled ? 0.6 : 1, minHeight: 36,
                  }}>
                  {selected ? "✓ " : "+ "}{label}
                </button>
              );
            })}
          </div>
        </div>
        <NavRow label={t.foodRules} sub={t.foodRulesSub} onClick={() => setFoodRulesOpen(true)} />
        {settingsData.weightGoal && (
          <ToggleRow label={t.portions} sub={settingsData.portionsVisible ? t.portionsApproved : t.portionsPending}
            checked={!!settingsData.weightGoal.show_portions} onChange={v => settingsData.requestPortions(v)} />
        )}
      </Section>

      <Section title={t.yourData}>
        <ToggleRow border={false} label={t.share} sub={t.shareSub} checked={!!settings?.share_with_nutritionist} onChange={v => settingsData.updateSettings({ share_with_nutritionist: v })} />
        <NavRow label={t.download} onClick={handleDownload} />
        <NavRow label={t.privacyAndConsent} onClick={() => setPrivacyOpen(true)} />
        <NavRow label={t.deleteAccount} danger onClick={() => setDeleteOpen(true)} />
      </Section>

      <Section title={t.help}>
        {settingsData.nutritionist?.contact_email && (
          <NavRow border={false} label={t.messageNutritionist} onClick={() => { window.location.href = `mailto:${settingsData.nutritionist.contact_email}`; }} />
        )}
        <NavRow border={!!settingsData.nutritionist?.contact_email} label={t.helpRow} onClick={() => { window.location.href = `mailto:${SUPPORT_EMAIL}`; }} />
        <button onClick={onSignOut} className="w-full px-4 py-3 flex items-center gap-2 text-left" style={{ borderTop: `1px solid ${C.line}`, minHeight: 44 }}>
          <LogOut size={16} color={C.text} />
          <span className="text-sm font-semibold" style={{ color: C.text }}>{t.signOut}</span>
        </button>
      </Section>

      <PrivacySheet open={privacyOpen} onClose={() => setPrivacyOpen(false)} lang={lang} t={t} consent={{ ...consent, withdrawConsent: handleWithdrawThenSignOut }} />
      <DeleteAccountSheet open={deleteOpen} onClose={() => setDeleteOpen(false)} t={t} onSignOut={onSignOut} />
      <Sheet open={foodRulesOpen} onClose={() => setFoodRulesOpen(false)} title={t.foodRules}>
        <div className="text-lg font-bold mb-3" style={{ color: C.navy }}>{t.foodRules}</div>
        {settingsData.foodRules.length === 0 ? (
          <p className="text-sm" style={{ color: C.textSoft }}>{t.foodRulesEmpty}</p>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
            {settingsData.foodRules.map((r, i) => (
              <div key={i} className="px-4 py-3 text-sm" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}`, color: C.text }}>
                {r.food ? (lang === "es" ? r.food.name_es || r.food.name_en : r.food.name_en) : r.family}
              </div>
            ))}
          </div>
        )}
      </Sheet>
    </div>
  );
}
