import { test, expect } from "@playwright/test";
import { gotoRoute, ROUTES } from "./helpers.js";

test("every main route renders for the main fixture with no console errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });

  for (const route of ROUTES) {
    await gotoRoute(page, route);
    const text = await page.textContent("body");
    expect(text.trim().length, `route ${route} rendered no text; errors=${JSON.stringify(errors)}`).toBeGreaterThan(0);
  }
  expect(errors).toEqual([]);
});
