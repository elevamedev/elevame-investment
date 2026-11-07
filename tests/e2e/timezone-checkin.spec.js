import { test, expect } from "@playwright/test";
import { gotoRoute } from "./helpers.js";

// Acceptance item 9 (brief section 9): between 00:00 and 02:00 Madrid
// time (fake the clock), a check-in lands on the local day. This is
// exactly the window where the local day and the UTC day disagree in
// Madrid (UTC+1 in November) — `new Date().toISOString().slice(0, 10)`
// would give the UTC day, one day behind. src/lib/localDate.js's
// isoDate() is the fix; this is the regression test for it.
test.use({ timezoneId: "Europe/Madrid" });

test("a daily check-in made at 00:30 Madrid time lands on that Madrid day, not the UTC day one day earlier", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-07T00:30:00+01:00"));
  await gotoRoute(page, "/", { fixture: "main" });

  // Answer every daily question with "3" and save.
  const saveButton = page.getByRole("button", { name: /save/i });
  await saveButton.waitFor();
  const scaleThrees = page.locator('button:has-text("3")');
  const count = await scaleThrees.count();
  for (let i = 0; i < count; i++) await scaleThrees.nth(i).click();
  await saveButton.click();
  await expect.poll(() => page.evaluate(() => window.__E2E_TABLES__.quick_checkins.length)).toBeGreaterThan(0);

  const quickCheckins = await page.evaluate(() => window.__E2E_TABLES__.quick_checkins);
  expect(quickCheckins, "no quick_checkins row was written").toHaveLength(1);
  expect(quickCheckins[0].day, "landed on the UTC day, not the Madrid local day").toBe("2026-11-07");
});
