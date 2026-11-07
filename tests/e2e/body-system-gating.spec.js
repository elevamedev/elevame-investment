import { test, expect } from "@playwright/test";
import { gotoRoute } from "./helpers.js";

// Acceptance item 5 (brief section 9): a body system page shows
// nothing from body_system_signals until reviewed_at is set. The
// mock client enforces this the way the real RLS policy does — see
// REVIEWED_AT_GATED in mockSupabaseClient.js — so this exercises the
// app's own handling of "nothing came back yet", not the SQL policy
// itself (that's scripts/test_db.sh / the private repo's acceptance
// suite).
test("an unreviewed body system page shows no signal content", async ({ page }) => {
  await gotoRoute(page, "/system/digestion", { fixture: "unreviewed" });
  const text = await page.textContent("body");
  expect(text).not.toContain("Robin Chen's digestion signal");
  expect(text).not.toContain("What Robin Chen's test shows");
});

test("a reviewed body system page shows its signal content", async ({ page }) => {
  await gotoRoute(page, "/system/digestion", { fixture: "main" });
  const text = await page.textContent("body");
  expect(text).toContain("Jordan Rivera's digestion signal");
});
