// Shared setup for every e2e spec: pick a synthetic fixture/theme
// before the app's first script runs, then clear the consent gate
// every route sits behind (brief 6.5) so the test can get to the
// screen it actually came to check.

export async function setupClient(page, { fixture = "main", theme, signedOut, authError, claimKitError, needsConfirmation } = {}) {
  await page.addInitScript(opts => {
    window.__E2E_FIXTURE__ = opts.fixture;
    if (opts.theme) window.__E2E_THEME__ = opts.theme;
    if (opts.signedOut) window.__E2E_SIGNED_OUT__ = true;
    if (opts.authError) window.__E2E_AUTH_ERROR__ = opts.authError;
    if (opts.claimKitError) window.__E2E_CLAIM_KIT_ERROR__ = opts.claimKitError;
    if (opts.needsConfirmation) window.__E2E_NEEDS_CONFIRMATION__ = true;
  }, { fixture, theme, signedOut, authError, claimKitError, needsConfirmation });
}

export async function agreeConsent(page) {
  // A plain `.count()` races the app's initial render (it can resolve 0
  // before React has even mounted the consent screen) — wait briefly for
  // the checkbox to actually show up, and treat a real timeout as "this
  // fixture's client already consented," not a render that's merely slow.
  const checkbox = page.locator('input[type="checkbox"]');
  try {
    await checkbox.waitFor({ timeout: 3000 });
  } catch {
    return;
  }
  await checkbox.check();
  await page.locator('button:has-text("Agree and continue")').click();
  await page.waitForTimeout(300);
}

export async function gotoRoute(page, path, opts) {
  await setupClient(page, opts);
  await page.goto(path, { waitUntil: "networkidle" });
  await agreeConsent(page);
}

export const ROUTES = ["/", "/plan", "/foods", "/gut", "/system/digestion", "/settings"];
