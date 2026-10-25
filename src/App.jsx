import { useMemo, useState } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate, useParams, useOutletContext, useLocation } from "react-router-dom";
import { Home, CalendarDays, Search, Gauge, Settings as SettingsIcon, LogOut } from "lucide-react";
import { C } from "./theme.js";
import { STRINGS } from "./i18n/strings.js";
import { PHASES as PHASES_DEFAULT, homeBanners } from "./data/planTemplate.js";
import { useAuth } from "./context/AuthContext.jsx";
import { useClientData } from "./hooks/useClientData.js";
import { useStaffRole } from "./hooks/useAdminData.js";
import { useSheetParam } from "./hooks/useSheetParam.js";
import Sheet from "./components/v4/Sheet.jsx";
import { resetQueryClientOnSignOut } from "./lib/OfflineQueryProvider.jsx";
import { clearPersistedCache } from "./lib/queryClient.js";
import SignInView from "./views/auth/SignInView.jsx";
import SignUpView from "./views/auth/SignUpView.jsx";
import ForgotPasswordView from "./views/auth/ForgotPasswordView.jsx";
import ResetPasswordView from "./views/auth/ResetPasswordView.jsx";
import ConfirmView from "./views/auth/ConfirmView.jsx";
import LinkKitView from "./views/auth/LinkKitView.jsx";
import StaffMfaGate from "./views/auth/StaffMfaGate.jsx";
import HomeView from "./views/HomeView.jsx";
import PlanView from "./views/PlanView.jsx";
import ShoppingView from "./views/ShoppingView.jsx";
import TrackerView from "./views/TrackerView.jsx";
import FoodsView from "./views/FoodsView.jsx";
import ReportView from "./views/ReportView.jsx";
import SupplementsView from "./views/SupplementsView.jsx";
import SettingsView from "./views/SettingsView.jsx";
import AdminView from "./views/AdminView.jsx";
import ToastStack from "./components/ToastStack.jsx";

const TAB_ICONS = { plan: CalendarDays, foods: Search, home: Home, gut: Gauge, settings: SettingsIcon };
const TAB_ORDER = ["plan", "foods", "home", "gut", "settings"];

/* ---------------- route guards ---------------- */

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/signin" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function LoadingScreen() {
  return <div style={{ background: C.bg, minHeight: "100vh" }} className="max-w-md mx-auto flex items-center justify-center text-sm" />;
}

/* Staff go straight to /admin and never see the client tab shell;
   a signed-in client with no linked kit goes to /link (brief 4.0). */
function RequireClient({ children }) {
  const { user } = useAuth();
  const staffRole = useStaffRole(user.id);
  const data = useClientData(user.id);
  const t = STRINGS.en; // no profile yet at this point, so no stored language preference to read

  if (staffRole === undefined) return <LoadingScreen />;
  if (staffRole) return <Navigate to="/admin" replace />;
  if (data.loading) {
    return <div style={{ background: C.bg, minHeight: "100vh", color: C.textSoft }} className="max-w-md mx-auto flex items-center justify-center text-sm">{t.loading}</div>;
  }
  if (data.error) {
    return <div style={{ background: C.bg, minHeight: "100vh", color: C.redText }} className="max-w-md mx-auto flex items-center justify-center text-sm px-6 text-center">{t.loadError}</div>;
  }
  if (!data.profile) {
    return <LinkKitView onClaimed={data.refetch} />;
  }
  return children({ data, user });
}

function RequireStaff({ children }) {
  const { user } = useAuth();
  const staffRole = useStaffRole(user.id);
  if (staffRole === undefined) return <LoadingScreen />;
  if (!staffRole) return <Navigate to="/" replace />;
  return <StaffMfaGate>{children}</StaffMfaGate>; // brief 4.0: staff need a second factor
}

/* ---------------- client tab shell ---------------- */

function TabShell({ data, user }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, phases } = data;
  const lang = profile?.language || "en";
  const t = STRINGS[lang];
  const effectivePhases = phases.length ? phases : PHASES_DEFAULT;

  async function handleSignOut() {
    await signOut();
    await clearPersistedCache(user.id); // brief 4.12: wipe this user's offline cache on sign out
    resetQueryClientOnSignOut();
    navigate("/signin", { replace: true });
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: C.bg, minHeight: "100vh" }} className="max-w-md mx-auto relative">
      <div className="sticky top-0 z-10 px-4 pt-4 pb-2" style={{ background: C.bg }}>
        <div className="flex items-center justify-between mb-2">
          <div className="font-extrabold text-lg" style={{ color: C.navy }}>Eleva<span style={{ color: C.purple }}>me</span></div>
          <button onClick={handleSignOut} title={t.login.signOut} aria-label={t.login.signOut} className="p-1.5 rounded-full" style={{ border: `1px solid ${C.line}` }}>
            <LogOut size={13} color={C.textSoft} />
          </button>
        </div>
        <div className="text-[11px] font-medium px-2 py-1 rounded-full inline-block" style={{ background: C.purpleSoft, color: C.purple }}>
          {profile?.full_name}{profile?.kit_code ? ` · ${profile.kit_code}` : ""}
        </div>
      </div>

      <Outlet context={{ data, user, lang, t, effectivePhases }} />

      <nav aria-label={t.nav.primary} className="fixed bottom-0 left-0 right-0 max-w-md mx-auto flex"
        style={{ background: "#fff", borderTop: `1px solid ${C.line}`, paddingBottom: "env(safe-area-inset-bottom)" }}>
        {TAB_ORDER.map(key => {
          const Icon = TAB_ICONS[key];
          const path = key === "home" ? "/" : `/${key}`;
          return (
            <button key={key} onClick={() => navigate(path)}
              aria-current={location.pathname === path ? "page" : undefined}
              className="flex-1 flex flex-col items-center gap-1 py-2.5">
              <Icon size={20} color={location.pathname === path ? C.purple : C.textSoft} strokeWidth={location.pathname === path ? 2.4 : 2} />
              <span className="text-[10px] font-medium" style={{ color: location.pathname === path ? C.purple : C.textSoft }}>{t.tabs[key]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ---------------- routed pages (thin wrappers reading the shell's context) ---------------- */

function HomePage() {
  const { lang, t, effectivePhases, data } = useOutletContext();
  const navigate = useNavigate();
  const { profile, milestones } = data;
  const startDate = profile?.plan_start_date || new Date().toISOString().slice(0, 10);
  const planDay = useMemo(() => {
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.min(Math.max(Math.floor((today - start) / 86400000), 0), 41) + 1;
  }, [startDate]);
  const phaseIdx = Math.min(Math.floor((planDay - 1) / 14), effectivePhases.length - 1);
  const dayIdx = (planDay - 1) % 7;
  const banners = useMemo(() => homeBanners(planDay, milestones), [planDay, milestones]);

  return (
    <HomeView lang={lang} t={t} startDate={startDate} setStartDate={d => data.updateProfile({ plan_start_date: d })}
      planDay={planDay} phaseIdx={phaseIdx} dayIdx={dayIdx} phases={effectivePhases}
      goToPlan={() => navigate("/plan")} goToScores={() => navigate("/gut")}
      banners={banners} goToMilestone={id => navigate(`/checkin/${id}`)} goToShopping={() => navigate("/plan/shopping")} />
  );
}

function PlanPage() {
  const { lang, t, effectivePhases } = useOutletContext();
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [dayIdx, setDayIdx] = useState(0);
  return <PlanView lang={lang} t={t} phases={effectivePhases} phaseIdx={phaseIdx} setPhaseIdx={setPhaseIdx} dayIdx={dayIdx} setDayIdx={setDayIdx} />;
}

function ShoppingPage() {
  const { lang, t, effectivePhases, data } = useOutletContext();
  const [phaseIdx, setPhaseIdx] = useState(0);
  return (
    <ShoppingView lang={lang} t={t} phases={effectivePhases} phaseIdx={phaseIdx} setPhaseIdx={setPhaseIdx}
      checks={data.checks} toggleCheck={data.toggleShoppingCheck} resetPhase={data.resetShoppingPhase} />
  );
}

function FoodsPage() {
  const { lang, t, user } = useOutletContext();
  return <FoodsView t={t} lang={lang} user={user} />;
}

function GutPage() {
  const { lang, user } = useOutletContext();
  const { isOpen, open, close } = useSheetParam();
  return (
    <>
      <ReportView lang={lang} user={user} onGoToFoods={() => {}} onOpenSupplements={() => open("supplements")} />
      <Sheet open={isOpen("supplements")} onClose={close} title="Supplements">
        <SupplementsView lang={lang} user={user} />
      </Sheet>
    </>
  );
}

function SystemPage() {
  const { lang, user } = useOutletContext();
  const { theme } = useParams();
  const navigate = useNavigate();
  return <ReportView lang={lang} user={user} initialThemeId={theme} onBackToInitialTheme={() => navigate(-1)} />;
}

function CheckinPage() {
  const { lang, t, data } = useOutletContext();
  const { milestone } = useParams();
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntry = data.entries.find(e => e.date === todayStr);
  return (
    <TrackerView t={t} lang={lang} entries={data.entries} todayEntry={todayEntry}
      saveEntry={form => data.saveTrackerEntry(todayStr, form)} milestones={data.milestones}
      saveMilestone={data.saveMilestoneEntry} planDay={null}
      openMilestone={milestone} setOpenMilestone={() => navigate("/")} />
  );
}

function SettingsPage() {
  const { lang, user, data } = useOutletContext();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  async function handleSignOut() {
    await signOut();
    await clearPersistedCache(user.id);
    resetQueryClientOnSignOut();
    navigate("/signin", { replace: true });
  }
  return <SettingsView lang={lang} profile={data.profile} setLang={l => data.updateProfile({ language: l })} onSignOut={handleSignOut} />;
}

/* ---------------- root ---------------- */

export default function App() {
  return (
    <>
      <ToastStack />
      <Routes>
        <Route path="/signin" element={<PublicOnly><SignInView /></PublicOnly>} />
        <Route path="/signup" element={<PublicOnly><SignUpView /></PublicOnly>} />
        <Route path="/forgot" element={<PublicOnly><ForgotPasswordView /></PublicOnly>} />
        <Route path="/auth/confirm" element={<ConfirmView />} />
        <Route path="/reset" element={<ResetPasswordView />} />
        <Route path="/admin/*" element={<RequireAuth><RequireStaff><AdminViewRoute /></RequireStaff></RequireAuth>} />
        <Route element={<RequireAuth><RequireClient>{(ctx) => <TabShell {...ctx} />}</RequireClient></RequireAuth>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/plan/shopping" element={<ShoppingPage />} />
          <Route path="/foods" element={<FoodsPage />} />
          <Route path="/gut" element={<GutPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/system/:theme" element={<SystemPage />} />
          <Route path="/checkin/:milestone" element={<CheckinPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function AdminViewRoute() {
  const [adminLang, setAdminLang] = useState("en");
  return <AdminView lang={adminLang} setLang={setAdminLang} />;
}
