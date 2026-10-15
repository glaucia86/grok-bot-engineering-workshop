import { expect, test } from "@playwright/test";

// Run only with playwright.preview.config.ts against an explicitly authorized
// isolated preview. Does not clear shared data or claim fresh-instance proof.
test("authorized preview: public form creates feedback visible after reload", async ({ page }, testInfo) => {
  const talk = `QA-${testInfo.testId}-${Date.now()}`;
  await page.goto("/");
  await page.getByLabel("Talk", { exact: true }).fill(talk);
  await page.getByLabel("Your name", { exact: true }).fill("Preview QA");
  await page.getByLabel("Comment", { exact: true }).fill("Authorized isolated preview verification");
  await page.getByRole("radio", { name: "5", exact: true }).check();
  const response = page.waitForResponse((result) => result.url().endsWith("/api/feedback") && result.request().method() === "POST");
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  expect((await response).status()).toBe(201);
  await expect(page.getByText("Feedback saved", { exact: false })).toBeVisible();
  await page.reload();
  const row = page.getByRole("table", { name: "Talk feedback summary" }).getByRole("row").filter({ hasText: talk });
  await expect(row.getByRole("cell", { name: /^5\.0\s*\/ 5$/ })).toBeVisible();
  await expect(row.getByRole("cell", { name: "1", exact: true })).toBeVisible();
  await testInfo.attach("created-preview-talk", { body: JSON.stringify({ talk, target: new URL(process.env.MVP_PREVIEW_URL!).origin, commit: process.env.MVP_PREVIEW_COMMIT }), contentType: "application/json" });
});
