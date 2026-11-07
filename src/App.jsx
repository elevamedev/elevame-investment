import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate, useParams, useOutletContext, useLocation } from "react-router-dom";
import { Home, CalendarDays, Search, Gauge, Settings as SettingsIcon, LogOut } from "lucide-react";
import { C } from "./theme.js";
import { STRINGS } from "./i18n/strings.js";
import { useAuth } from "./context/AuthContext.jsx";
import { useClientData } from "./hooks/useClientData.js";
import { useStaffRole } from "./hooks/useAdminData.js";
import { useV4Consent } from "./hooks/useV4Consent.js";
import { useV4ThemeSync } from "./hooks/useV4ThemeSync.js";
import { resetQueryClientOnSignOut } from "./lib/OfflineQueryProvider.jsx";
import { clearPersistedCache } from "./lib/queryClient.js";
import { installOfflineFlush } from "./lib/offlineQueue.js";
import SignInView from "./views/auth/SignInView.jsx";
import SignUpView from "./views/auth/SignUpView.jsx";
import ForgotPasswordView from "./views/auth/ForgotPasswordView.jsx";
import ResetPasswordView from "./views/auth/ResetPasswordView.jsx";
import ConfirmView from "./views/auth/ConfirmView.jsx";
import LinkKitView from "./views/auth/LinkKitView.jsx";
import StaffMfaGate from "./views/auth/StaffMfaGate.jsx";
import HomeView from "./views/HomeView.jsx";
import PlanView from "./views/PlanView.jsx";
import CheckinFlowView from "./views/CheckinFlowView.jsx";
import FoodsView from "./views/FoodsView.jsx";
import GutView from "./views/GutView.jsx";
import BodySystemView from "./views/BodySystemView.jsx";
import SettingsView from "./views/SettingsView.jsx";
import ConsentView from "./views/ConsentView.jsx";
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
  const consent = useV4Consent(user.id);
  useV4ThemeSync(user.id);
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
  // Brief 6.5: no result shows until health-data consent is given.
  if (consent.loading) return <LoadingScreen />;
  if (!consent.hasConsent) {
    return <ConsentView lang={data.profile?.language || "en"} onAgree={consent.giveConsent} />;
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
  const { profile } = data;
  const lang = profile?.language || "en";
  const t = STRINGS[lang];

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

      <Outlet context={{ data, user, lang, t }} />

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
  const { lang, user, data } = useOutletContext();
  const navigate = useNavigate();
  return <HomeView lang={lang} user={user} profile={data.profile} goToSettings={() => navigate("/settings")} />;
}

function PlanPage() {
  const { lang, user, data } = useOutletContext();
  return <PlanView lang={lang} user={user} profile={data.profile} />;
}

function FoodsPage() {
  const { lang, user, data } = useOutletContext();
  return <FoodsView lang={lang} user={user} profileId={data.profile?.id} />;
}

function GutPage() {
  const { lang, user, data } = useOutletContext();
  return <GutView lang={lang} user={user} profile={data.profile} />;
}

function SystemPage() {
  const { lang, user, data } = useOutletContext();
  const { theme } = useParams();
  return <BodySystemView lang={lang} user={user} profile={data.profile} themeId={theme} />;
}

function CheckinFlowPage({ data, user }) {
  const lang = data.profile?.language || "en";
  return <CheckinFlowView lang={lang} user={user} profile={data.profile} />;
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
  return <SettingsView lang={lang} user={user} profile={data.profile} setLang={l => data.updateProfile({ language: l })} onSignOut={handleSignOut} />;
}

/* ---------------- root ---------------- */

export default function App() {
  useEffect(() => { installOfflineFlush(); }, []); // brief 4.10: check ins must save offline, so retry queued writes once back online
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
        {/* Full screen, not a sheet, not the tab shell (brief 4.10) */}
        <Route path="/checkin/:milestone" element={<RequireAuth><RequireClient>{(ctx) => <CheckinFlowPage {...ctx} />}</RequireClient></RequireAuth>} />
        <Route element={<RequireAuth><RequireClient>{(ctx) => <TabShell {...ctx} />}</RequireClient></RequireAuth>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/plan/shopping" element={<PlanPage />} />
          <Route path="/foods" element={<FoodsPage />} />
          <Route path="/gut" element={<GutPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/system/:theme" element={<SystemPage />} />
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
