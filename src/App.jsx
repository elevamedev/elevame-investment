import { useMemo, useState } from "react";
import { Home, CalendarDays, ShoppingCart, Activity, Search, Gauge, LogOut } from "lucide-react";
import { C } from "./theme.js";
import { STRINGS } from "./i18n/strings.js";
import { MICROBIOME_AGE_DEFAULT, DIVERSITY_DEFAULT } from "./data/gutScoresTemplate.js";
import { PHASES as PHASES_DEFAULT, homeBanners } from "./data/planTemplate.js";
import { useAuth } from "./context/AuthContext.jsx";
import { useClientData } from "./hooks/useClientData.js";
import LoginView from "./views/LoginView.jsx";
import HomeView from "./views/HomeView.jsx";
import PlanView from "./views/PlanView.jsx";
import ShoppingView from "./views/ShoppingView.jsx";
import TrackerView from "./views/TrackerView.jsx";
import ScoresView from "./views/ScoresView.jsx";
import FoodsView from "./views/FoodsView.jsx";

const TAB_ICONS = { home: Home, scores: Gauge, plan: CalendarDays, shopping: ShoppingCart, tracker: Activity, foods: Search };
const TAB_ORDER = ["home", "scores", "plan", "shopping", "tracker", "foods"];

function AppShell() {
  const { user, signOut } = useAuth();
  const {
    loading, error, profile, phases, gutScores, keyBacteria, checks, entries, milestones,
    updateProfile, toggleShoppingCheck, resetShoppingPhase, saveTrackerEntry, saveMilestoneEntry,
  } = useClientData(user.id);

  const [tab, setTab] = useState("home");
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [dayIdx, setDayIdx] = useState(0);
  const [openMilestone, setOpenMilestone] = useState(null);

  const lang = profile?.language || "en";
  const t = STRINGS[lang];
  // Falls back to the built-in 6-week template if this client has no
  // personalised plan rows yet (e.g. the seed script hasn't run for them).
  const effectivePhases = phases.length ? phases : PHASES_DEFAULT;

  const startDate = profile?.plan_start_date || new Date().toISOString().slice(0, 10);
  const planDay = useMemo(() => {
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today - start) / 86400000);
    return Math.min(Math.max(diff, 0), 41) + 1;
  }, [startDate]);

  const homePhaseIdx = Math.min(Math.floor((planDay - 1) / 14), effectivePhases.length - 1);
  const homeDayIdx = (planDay - 1) % 7;
  const banners = useMemo(() => homeBanners(planDay, milestones), [planDay, milestones]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntry = entries.find(e => e.date === todayStr);

  function goToMilestone(id) { setOpenMilestone(id); setTab("tracker"); }
  function goToShopping(phaseId) {
    const idx = effectivePhases.findIndex(p => p.id === phaseId);
    setPhaseIdx(idx === -1 ? 0 : idx);
    setTab("shopping");
  }
  function setLang(l) { updateProfile({ language: l }); }
  function setStartDate(d) { updateProfile({ plan_start_date: d }); }

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", color: C.textSoft }} className="max-w-md mx-auto flex items-center justify-center text-sm">
        {t.loading}
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", color: C.red }} className="max-w-md mx-auto flex items-center justify-center text-sm px-6 text-center">
        {t.loadError}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif", background: C.bg, minHeight: "100vh" }} className="max-w-md mx-auto relative">
      <div className="sticky top-0 z-10 px-4 pt-4 pb-2" style={{ background: C.bg }}>
        <div className="flex items-center justify-between mb-2">
          <div className="font-extrabold text-lg" style={{ color: C.navy }}>Eleva<span style={{ color: C.purple }}>me</span></div>
          <div className="flex items-center gap-1.5">
            {["en", "es"].map(l => (
              <button key={l} onClick={() => setLang(l)} className="text-[11px] font-semibold px-2 py-1 rounded-full"
                style={{ background: lang === l ? C.navy : "#fff", color: lang === l ? "#fff" : C.textSoft, border: `1px solid ${lang === l ? C.navy : C.line}` }}>
                {l.toUpperCase()}
              </button>
            ))}
            <button onClick={signOut} title={t.login.signOut} className="p-1.5 rounded-full" style={{ border: `1px solid ${C.line}` }}>
              <LogOut size={13} color={C.textSoft} />
            </button>
          </div>
        </div>
        <div className="text-[11px] font-medium px-2 py-1 rounded-full inline-block" style={{ background: C.purpleSoft, color: C.purple }}>
          {profile?.full_name}{profile?.kit_code ? ` · ${profile.kit_code}` : ""}
        </div>
      </div>

      {tab === "home" && (
        <HomeView lang={lang} t={t} startDate={startDate} setStartDate={setStartDate} planDay={planDay}
          phaseIdx={homePhaseIdx} dayIdx={homeDayIdx} phases={effectivePhases}
          goToPlan={() => { setPhaseIdx(homePhaseIdx); setDayIdx(homeDayIdx); setTab("plan"); }}
          goToScores={() => setTab("scores")}
          banners={banners} goToMilestone={goToMilestone} goToShopping={goToShopping} />
      )}
      {tab === "scores" && (
        <ScoresView t={t} lang={lang}
          gutScores={gutScores.length ? gutScores : []}
          keyBacteria={keyBacteria.length ? keyBacteria : []}
          microbiomeAge={profile?.microbiome_age ?? MICROBIOME_AGE_DEFAULT}
          diversity={{ value: profile?.diversity_value ?? DIVERSITY_DEFAULT.value, max: profile?.diversity_max ?? DIVERSITY_DEFAULT.max }} />
      )}
      {tab === "plan" && <PlanView lang={lang} t={t} phases={effectivePhases} phaseIdx={phaseIdx} setPhaseIdx={setPhaseIdx} dayIdx={dayIdx} setDayIdx={setDayIdx} />}
      {tab === "shopping" && (
        <ShoppingView lang={lang} t={t} phases={effectivePhases} phaseIdx={phaseIdx} setPhaseIdx={setPhaseIdx}
          checks={checks} toggleCheck={toggleShoppingCheck} resetPhase={resetShoppingPhase} />
      )}
      {tab === "tracker" && (
        <TrackerView t={t} lang={lang} entries={entries} todayEntry={todayEntry} saveEntry={form => saveTrackerEntry(todayStr, form)}
          milestones={milestones} saveMilestone={saveMilestoneEntry} planDay={planDay}
          openMilestone={openMilestone} setOpenMilestone={setOpenMilestone} />
      )}
      {tab === "foods" && <FoodsView t={t} lang={lang} />}

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto flex" style={{ background: "#fff", borderTop: `1px solid ${C.line}` }}>
        {TAB_ORDER.map(key => {
          const Icon = TAB_ICONS[key];
          const active = tab === key;
          return (
            <button key={key} onClick={() => setTab(key)} className="flex-1 flex flex-col items-center gap-1 py-2.5">
              <Icon size={20} color={active ? C.purple : C.textSoft} strokeWidth={active ? 2.4 : 2} />
              <span className="text-[10px] font-medium" style={{ color: active ? C.purple : C.textSoft }}>{t.tabs[key]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const [loginLang, setLoginLang] = useState("en");

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh" }} className="max-w-md mx-auto flex items-center justify-center text-sm" />
    );
  }
  if (!user) {
    return <LoginView t={STRINGS[loginLang]} lang={loginLang} setLang={setLoginLang} />;
  }
  return <AppShell />;
}
