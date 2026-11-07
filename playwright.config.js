import { defineConfig, devices } from "@playwright/test";

/**
 * Brief section 9's acceptance tests, run against the real app built
 * in --mode e2e (vite.config.js aliases supabaseClient.js to
 * tests/e2e/mockSupabaseClient.js in that mode only — the production
 * file is never touched). Each spec picks its fixture and theme via
 * window.__E2E_FIXTURE__ / __E2E_THEME__ (tests/e2e/fixtures.js),
 * never real client data. Viewport (320/390, brief 7.2/9.7) is set
 * per test, not per project — the app's dark mode is a client_settings
 * value the fixture carries, not the OS `prefers-color-scheme` a
 * Playwright project's colorScheme would set.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.js",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:5193",
    viewport: { width: 390, height: 844 },
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    // A built-and-served app, not the dev server: a cold `vite dev`
    // hit by several parallel workers at once would occasionally
    // race its own dependency pre-bundling and serve a request from
    // before the e2e-mode mock-client plugin applied. `vite preview`
    // just serves the already-built dist-e2e/ — nothing to race.
    command: "npm run build:e2e && npm run preview:e2e -- --port 5193 --strictPort",
    url: "http://localhost:5193",
    reuseExistingServer: false,
    timeout: 60000,
  },
});
