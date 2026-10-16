import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { previewTarget } from "../src/lib/preview-target";
import { withPreviewEvidence } from "../src/lib/preview-evidence";
import { installPreviewTransport } from "./preview-transport";

// Run only with playwright.preview.config.ts against an explicitly authorized
// isolated preview. Does not clear shared data or claim fresh-instance proof.
test("authorized preview: public form creates feedback visible after reload", async ({ page }) => {
  const target = previewTarget(process.env);
  await withPreviewEvidence(resolve("preview-evidence"), target, async (run) => {
    const { talk } = run;
    // Applied before navigation: a protection/login redirect or external form
    // action cannot carry this run's requests to another origin.
    await installPreviewTransport(page.context(), target.origin);
    // Reads never follow a redirect, and an occupied dataset stops BEFORE writes.
    // Empty GET is a precondition, not proof of provider/database isolation.
    const before = await page.request.get("/api/feedback", { maxRedirects: 0 });
    expect(before.status(), "BLOCKED: preview API unavailable or protected").toBe(200);
    expect(JSON.stringify(await before.json()) === "[]", "BLOCKED: QA dataset must start empty").toBe(true);
    await page.goto("/results");
    await expect(page.getByRole("heading", { name: "No feedback yet" })).toBeVisible();
    // Three bounded invalid writes; public aggregates must remain empty.
    run.phase("invalid-submit");
    for (const [field, value] of [["rating", "5"], ["author", " "], ["comment", "x".repeat(1001)]] as const) {
      run.postAttempt();
      const rejected = await page.request.post("/api/feedback", { maxRedirects: 0, data: {
        talkId: talk, author: "Preview QA", comment: "Synthetic QA", rating: 5, [field]: value,
      } });
      expect(rejected.status()).toBe(400);
      const body = await rejected.json();
      expect(typeof body.errors?.[field] === "string", "Field-specific API validation").toBe(true);
    }
    const afterInvalid = await page.request.get("/api/feedback", { maxRedirects: 0 });
    expect(afterInvalid.status()).toBe(200);
    expect(JSON.stringify(await afterInvalid.json()) === "[]", "Rejected requests must not insert").toBe(true);
    await page.goto("/feedback");
    await page.getByLabel("Talk", { exact: true }).fill(`  ${talk}  `);
    await page.getByLabel("Your name", { exact: true }).fill("  Preview QA  ");
    await page.getByLabel("Comment (optional)", { exact: true }).fill("  Synthetic QA  ");
    await page.getByRole("radio", { name: "5 stars", exact: true }).check();
    const response = page.waitForResponse((result) => result.url().endsWith("/api/feedback") && result.request().method() === "POST");
    run.phase("form-submit");
    run.postAttempt();
    await page.getByRole("button", { name: "Send feedback", exact: true }).click();
    const created = await response;
    expect(created.status()).toBe(201);
    const record = await created.json();
    expect(record.talkId === talk && record.author === "Preview QA" && record.comment === "Synthetic QA" && record.rating === 5,
      "POST returns normalized synthetic values").toBe(true);
    await expect(page.getByText("Feedback saved", { exact: false })).toBeVisible();
    await expect(page).toHaveURL(/\/feedback$/);
    await page.getByRole("link", { name: "View results", exact: true }).click();
    await expect(page).toHaveURL(/\/results$/);
    run.phase("reload");
    await page.reload();
    const persisted = await page.request.get("/api/feedback", { maxRedirects: 0 });
    expect(persisted.status()).toBe(200);
    const summaries = await persisted.json();
    expect(Array.isArray(summaries) && summaries.some((summary) => summary.talkId === talk && summary.average === 5 && summary.count === 1),
      "Public GET retains the created contribution after reload").toBe(true);
    const row = page.getByRole("table", { name: "Talk feedback summary" }).getByRole("row").filter({ hasText: talk });
    await expect(row.getByRole("cell", { name: /^5\.0\s*\/ 5$/ })).toBeVisible();
    await expect(row.getByRole("cell", { name: "1", exact: true })).toBeVisible();
    run.phase("verified");
    return { count: 1, average: 5 };
  });
});
