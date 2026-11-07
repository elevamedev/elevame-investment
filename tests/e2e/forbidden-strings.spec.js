import { test, expect } from "@playwright/test";
import { gotoRoute, ROUTES } from "./helpers.js";

// Acceptance item 2 (brief section 9): no string matches [–—], " - ",
// p\d+, "Report p", "Plan p", undefined or NaN on any route.
const FORBIDDEN = [
  { name: "en or em dash", re: /[–—]/ },
  { name: "space-hyphen-space", re: / - / },
  { name: "a page number (p\\d+)", re: /\bp\d+\b/i },
  { name: "\"Report p\"", re: /Report p/i },
  { name: "\"Plan p\"", re: /Plan p/i },
  { name: "the literal string undefined", re: /\bundefined\b/ },
  { name: "the literal string NaN", re: /\bNaN\b/ },
];

for (const route of ROUTES) {
  test(`no forbidden string on ${route}`, async ({ page }) => {
    await gotoRoute(page, route);
    const text = await page.textContent("body");
    for (const { name, re } of FORBIDDEN) {
      expect(text, `${route} contains ${name}: ${JSON.stringify(text.match(re)?.[0])}`).not.toMatch(re);
    }
  });
}
