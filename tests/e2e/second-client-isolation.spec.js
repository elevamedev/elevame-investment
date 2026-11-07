import { test, expect } from "@playwright/test";
import { gotoRoute, ROUTES } from "./helpers.js";

// Acceptance item 4 (brief section 9): for the synthetic second client,
// nothing from the first client appears. "main" and "second" are two
// unrelated synthetic clients (tests/e2e/fixtures.js) — neither is real
// client data, consistent with the standing constraint never to put
// real client data in this repo.
test("the second synthetic client sees none of the main client's text", async ({ page }) => {
  for (const route of ROUTES) {
    await gotoRoute(page, route, { fixture: "second" });
    const text = await page.textContent("body");
    expect(text, `${route} leaked the main client's name`).not.toContain("Jordan Rivera");
    expect(text, `${route} leaked the main client's kit code`).not.toContain("ELVMTEST0001");
    expect(text, `${route} leaked the main client's bacterium`).not.toContain("Faecalibacterium");
    // and it sees its own, confirming the route actually rendered real data, not just an empty shell
    if (route === "/") expect(text).toContain("Sam Okafor");
  }
});
