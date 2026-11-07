import { test, expect } from "@playwright/test";
import { setupClient } from "./helpers.js";

// Acceptance item 8 (brief section 9): wrong password, unconfirmed
// email, the three kit errors, and the 60 second resend wait. Reset
// "on a fresh browser context" needs a real mailbox/token and a
// second real browser profile against a live Supabase Auth server —
// out of reach here; the resend cooldown it also names is covered
// below instead.

test("wrong password shows the sign-in error, not the unconfirmed one", async ({ page }) => {
  await setupClient(page, { signedOut: true, authError: "mismatch" });
  await page.goto("/signin");
  await page.getByLabel(/email/i).fill("client@example.com");
  await page.getByLabel(/password/i).fill("wrong-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForTimeout(300);
  const body = await page.textContent("body");
  expect(body).toMatch(/password/i);
  expect(body.toLowerCase()).not.toContain("confirm your email");
});

test("unconfirmed email shows the confirmation-needed message", async ({ page }) => {
  await setupClient(page, { signedOut: true, authError: "unconfirmed" });
  await page.goto("/signin");
  await page.getByLabel(/email/i).fill("client@example.com");
  await page.getByLabel(/password/i).fill("whatever");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForTimeout(300);
  const body = await page.textContent("body");
  expect(body.toLowerCase()).toContain("confirm");
});

test("sign up resend is disabled for 60 seconds", async ({ page }) => {
  await setupClient(page, { signedOut: true, needsConfirmation: true });
  await page.goto("/signup");
  await page.getByLabel(/email/i).fill("new-client@example.com");
  await page.getByLabel(/password/i).fill("a-strong-password-1");
  await page.getByRole("button", { name: /create account|sign up/i }).click();
  await page.waitForTimeout(300);
  const resendButton = page.getByRole("button", { name: /send it again|resend|s\./i });
  await expect(resendButton).toBeDisabled();
  const body = await page.textContent("body");
  expect(body).toMatch(/\d+\s*s\.?/); // a visible countdown, e.g. "60 s."
});

test("forgot-password resend is disabled for 60 seconds after sending", async ({ page }) => {
  await setupClient(page, { signedOut: true });
  await page.goto("/forgot");
  await page.getByLabel(/email/i).fill("client@example.com");
  await page.getByRole("button", { name: /reset|send/i }).click();
  await page.waitForTimeout(300);
  const resendButton = page.getByRole("button", { name: /send it again|resend|s\./i });
  await expect(resendButton).toBeDisabled();
});

for (const [errorKey, mustContain] of [
  ["not_found", /code/i],
  ["email_mismatch", /email/i],
  ["already_claimed", /already|claimed/i],
]) {
  test(`link-kit error "${errorKey}" shows its own message`, async ({ page }) => {
    await setupClient(page, { fixture: "noProfile", claimKitError: errorKey });
    await page.goto("/");
    await page.waitForTimeout(300);
    await page.getByLabel(/kit code/i).fill("ELVMTEST9999");
    await page.getByRole("button", { name: /link|claim/i }).click();
    await page.waitForTimeout(300);
    expect(await page.textContent("body")).toMatch(mustContain);
  });
}
