import { FIXTURES } from "./fixtures.js";

// Mirrors the RLS policy these 3 tables actually run under
// (20261023000000_portal_knowledge_v4.sql: "reviewed_at is not null and
// client_sees_test(test_id)"): a client who queries an unreviewed row
// gets none back, not a row it has to know to hide. Acceptance item 5.
const REVIEWED_AT_GATED = ["body_system_status", "body_system_signals", "body_system_levers"];

// Real Supabase upserts resolve conflicts by a table's primary/unique key,
// not by whatever .eq() filters happen to be chained — upsert() is called
// with none. The app's real upsert call sites are few enough to hardcode.
const UPSERT_KEYS = {
  shopping_checks: ["profile_id", "phase_key", "food_id"],
  tracker_entries: ["profile_id", "date"],
  milestones: ["profile_id", "milestone_id"],
  meal_logs: ["client_id", "meal_id", "day"],
  quick_checkins: ["client_id", "day"],
  food_review_flags: ["test_id", "food_id"],
};

const fixtureName = typeof window !== "undefined" && window.__E2E_FIXTURE__ ? window.__E2E_FIXTURE__ : "main";
const fixture = (FIXTURES[fixtureName] || FIXTURES.main)();
const { USER_ID, TABLES } = fixture;

if (typeof window !== "undefined" && window.__E2E_THEME__ && TABLES.client_settings[0]) {
  TABLES.client_settings[0].theme = window.__E2E_THEME__;
}

// Lets specs read back what got written (e.g. tests/e2e/timezone-checkin.spec.js
// checking which calendar day a check-in actually landed on) without a
// second round of app UI to read it back through.
if (typeof window !== "undefined") window.__E2E_TABLES__ = TABLES;

function makeQuery(table) {
  const filters = []; const neqFilters = []; const isFilters = []; const inFilters = [];
  const gteFilters = []; const lteFilters = [];
  let single = false; let payload = null; let op = "select"; let limitN = null; let orderCol = null; let orderAsc = true;
  const q = {
    select() { return q; },
    eq(col, val) { filters.push([col, val]); return q; },
    neq(col, val) { neqFilters.push([col, val]); return q; },
    in(col, vals) { inFilters.push([col, vals]); return q; },
    is(col, val) { isFilters.push([col, val]); return q; },
    gte(col, val) { gteFilters.push([col, val]); return q; },
    lte(col, val) { lteFilters.push([col, val]); return q; },
    order(col, opts) { orderCol = col; orderAsc = opts?.ascending !== false; return q; },
    limit(n) { limitN = n; return q; },
    maybeSingle() { single = true; return q; },
    single() { single = true; return q; },
    insert(p) { op = "insert"; payload = p; return q; },
    update(p) { op = "update"; payload = p; return q; },
    upsert(p) { op = "upsert"; payload = p; return q; },
    delete() { op = "delete"; return q; },
    then(resolve, reject) {
      TABLES[table] ||= [];
      const rows = TABLES[table];
      const matches = r => filters.every(([c, v]) => r[c] === v)
        && neqFilters.every(([c, v]) => r[c] !== v)
        && inFilters.every(([c, vs]) => vs.includes(r[c]))
        && isFilters.every(([c, v]) => (r[c] ?? null) === v)
        && gteFilters.every(([c, v]) => r[c] >= v)
        && lteFilters.every(([c, v]) => r[c] <= v);
      try {
        if (op === "insert") {
          const items = (Array.isArray(payload) ? payload : [payload]).map(it => ({ id: it.id || `${table}-${rows.length}-${Math.random().toString(36).slice(2)}`, given_at: new Date().toISOString(), withdrawn_at: null, ...it }));
          items.forEach(it => rows.push(it));
          return Promise.resolve({ data: single ? items[0] : items, error: null }).then(resolve, reject);
        }
        if (op === "upsert") {
          const items = Array.isArray(payload) ? payload : [payload];
          const key = UPSERT_KEYS[table] || [];
          items.forEach(it => {
            const existing = key.length ? rows.find(r => key.every(c => r[c] === it[c])) : null;
            if (existing) Object.assign(existing, it); else rows.push({ ...it });
          });
          return Promise.resolve({ data: items, error: null }).then(resolve, reject);
        }
        if (op === "update") {
          rows.filter(matches).forEach(r => Object.assign(r, payload));
          return Promise.resolve({ data: null, error: null }).then(resolve, reject);
        }
        if (op === "delete") {
          const keep = rows.filter(r => !matches(r));
          TABLES[table] = keep;
          return Promise.resolve({ data: null, error: null }).then(resolve, reject);
        }
        let result = rows.filter(matches);
        if (REVIEWED_AT_GATED.includes(table)) result = result.filter(r => r.reviewed_at != null);
        if (orderCol) result = result.slice().sort((a, b) => orderAsc ? (a[orderCol] > b[orderCol] ? 1 : -1) : (a[orderCol] < b[orderCol] ? 1 : -1));
        if (limitN != null) result = result.slice(0, limitN);
        const data = single ? (result[0] || null) : result;
        return Promise.resolve({ data, error: null }).then(resolve, reject);
      } catch (e) {
        return Promise.resolve({ data: null, error: e }).then(resolve, reject);
      }
    },
  };
  return q;
}

const RPCS = {
  my_nutritionist_contact: () => ({ data: [], error: null }),
  portions_visible: () => ({ data: false, error: null }),
  adoption_weekly: () => ({
    data: Array.from({ length: 6 }, (_, i) => ({ week: i + 1, meals_followed: 10, meals_planned: 12 })),
    error: null,
  }),
  export_my_data: () => ({ data: { exported_at: new Date().toISOString() }, error: null }),
  // tests/e2e/auth-edge-cases.spec.js sets window.__E2E_CLAIM_KIT_ERROR__
  // to one of the 3 kit errors LinkKitView.jsx maps (brief acceptance 9/8).
  claim_kit: () => {
    const errKey = typeof window !== "undefined" ? window.__E2E_CLAIM_KIT_ERROR__ : null;
    return errKey ? { data: { success: false, error: errKey }, error: null } : { data: { success: true }, error: null };
  },
};

// A signed-in session by default; tests/e2e/auth-edge-cases.spec.js sets
// window.__E2E_SIGNED_OUT__ before navigating to the sign-in screen, and
// window.__E2E_AUTH_ERROR__ ("mismatch" | "unconfirmed") to make
// signInWithPassword fail the way the real auth server would.
let currentSession = (typeof window !== "undefined" && window.__E2E_SIGNED_OUT__) ? null : { user: { id: USER_ID, email: "client@example.com" } };
const authListeners = [];
function notifyAuth(event) { authListeners.forEach(cb => cb(event, currentSession)); }

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: currentSession } }),
    onAuthStateChange(cb) {
      authListeners.push(cb);
      return { data: { subscription: { unsubscribe() { const i = authListeners.indexOf(cb); if (i >= 0) authListeners.splice(i, 1); } } } };
    },
    signOut: async () => { currentSession = null; notifyAuth("SIGNED_OUT"); return { error: null }; },
    signInWithPassword: async ({ email }) => {
      const authError = typeof window !== "undefined" ? window.__E2E_AUTH_ERROR__ : null;
      if (authError) {
        return { data: { session: null }, error: authError === "unconfirmed" ? { message: "Email not confirmed", code: "email_not_confirmed" } : { message: "Invalid login credentials" } };
      }
      currentSession = { user: { id: USER_ID, email } };
      notifyAuth("SIGNED_IN");
      return { data: { session: currentSession }, error: null };
    },
    signUp: async ({ email }) => {
      if (typeof window !== "undefined" && window.__E2E_NEEDS_CONFIRMATION__) {
        return { data: { session: null, user: { id: USER_ID, email } }, error: null };
      }
      currentSession = { user: { id: USER_ID, email } };
      notifyAuth("SIGNED_IN");
      return { data: { session: currentSession, user: currentSession.user }, error: null };
    },
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
  },
  from(table) { return makeQuery(table); },
  rpc(name, args) { return Promise.resolve((RPCS[name] || (() => ({ data: null, error: null })))(args)); },
  functions: {
    invoke(name) {
      if (name === "delete-account") return Promise.resolve({ data: { ok: true }, error: null });
      return Promise.resolve({ data: null, error: null });
    },
  },
};
