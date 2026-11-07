import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { gotoRoute, ROUTES } from "./helpers.js";

// Acceptance item 7 (brief section 9): Playwright at 320 and 390 px,
// light and dark, on every route: no horizontal scroll, axe finds no
// serious issue, focus is visible and never hidden.
const VIEWPORTS = [{ width: 320, height: 720 }, { width: 390, height: 844 }];
const THEMES = ["light", "dark"];

for (const viewport of VIEWPORTS) {
  for (const theme of THEMES) {
    for (const route of ROUTES) {
      test(`${route} at ${viewport.width}px ${theme}: no horizontal scroll, no serious a11y issue`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await gotoRoute(page, route, { theme });

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth, "page scrolls horizontally").toBeLessThanOrEqual(viewport.width + 1); // +1 for sub-pixel rounding

        const results = await new AxeBuilder({ page }).include("body").analyze();
        const serious = results.violations.filter(v => v.impact === "serious" || v.impact === "critical");
        expect(serious, JSON.stringify(serious.map(v => ({ id: v.id, nodes: v.nodes.length })))).toEqual([]);
      });
    }
  }
}

test("a focused element is visibly focused (focus ring not suppressed)", async ({ page }) => {
  await gotoRoute(page, "/settings");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => {
    const el = document.activeElement;
    const style = getComputedStyle(el);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, tag: el.tagName };
  });
  expect(outline.outlineStyle, `focused element is a <${outline.tag}> with no visible outline`).not.toBe("none");
});
