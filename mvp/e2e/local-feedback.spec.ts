import { expect, test, type Page } from "@playwright/test";
import { feedbackSchema, fieldErrors } from "../src/lib/feedback-schema";
import { summarize } from "../src/lib/stats";

// Browser UX fixture only. The real handlers/Drizzle persistence have separate
// integration tests in src/db/persistence.test.ts. This is NOT preview acceptance.
async function fixture(page: Page) {
  const rows: { talkId: string; rating: number }[] = [];
  const created: unknown[] = [];
  let failPost = false;
  await page.route("**/api/feedback", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: summarize(rows) });
      return;
    }
    if (failPost) {
      await route.fulfill({ status: 503, body: "Unavailable" });
      return;
    }
    const parsed = feedbackSchema.safeParse(route.request().postDataJSON());
    if (!parsed.success) {
      await route.fulfill({ status: 400, json: { errors: fieldErrors(parsed.error) } });
      return;
    }
    rows.push(parsed.data);
    created.push(parsed.data);
    await route.fulfill({ status: 201, json: {
      id: rows.length, ...parsed.data, createdAt: new Date().toISOString(),
    } });
  });
  return { rows, created, fail: () => { failPost = true; } };
}

async function fill(page: Page, talk = "  Engineering bots  ", rating = "5") {
  await page.getByLabel("Talk", { exact: true }).fill(talk);
  await page.getByLabel("Your name", { exact: true }).fill("  Ana  ");
  await page.getByLabel("Comment", { exact: true }).fill("  Useful examples  ");
  await page.getByRole("radio", { name: rating, exact: true }).check();
}

test("local fixture: shared errors, retained input, normalized creation, reset and reload", async ({ page }, testInfo) => {
  const api = await fixture(page);
  await page.goto("/");
  await expect(page.locator("#results")).toBeVisible();
  await expect(page.getByRole("heading", { name: "No feedback yet" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("empty-local-fixture.png"), fullPage: true });
  await page.getByLabel("Your name", { exact: true }).fill("Ana");
  await page.getByLabel("Talk", { exact: true }).fill(" ");
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  const expected = feedbackSchema.safeParse({ talkId: " ", author: "Ana", comment: "", rating: undefined });
  if (expected.success) throw new Error("Invalid fixture unexpectedly passed");
  for (const message of Object.values(fieldErrors(expected.error))) {
    await expect(page.locator("#feedback").getByText(message, { exact: true })).toBeVisible();
  }
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("Ana");
  expect(api.created).toHaveLength(0);
  await fill(page);
  await page.getByLabel("Comment", { exact: true }).fill(`  ${"x".repeat(1001)}  `);
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  await expect(page.getByText("comment must be at most 1000 characters", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Comment", { exact: true })).toHaveValue(`  ${"x".repeat(1001)}  `);
  expect(api.created).toHaveLength(0);
  await page.getByLabel("Comment", { exact: true }).fill("  Useful examples  ");
  await page.getByRole("radio", { name: "4", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "5", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  await expect(page.getByText("Feedback saved", { exact: false })).toBeVisible();
  expect(api.created).toEqual([{ talkId: "Engineering bots", author: "Ana", comment: "Useful examples", rating: 5 }]);
  for (const label of ["Talk", "Your name", "Comment"]) await expect(page.getByLabel(label, { exact: true })).toHaveValue("");
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  await expect(page.locator("#results").getByText("Engineering bots", { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.locator("#results").getByText("Engineering bots", { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("desktop-local-fixture.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("main")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("mobile-local-fixture.png"), fullPage: true });
});

test("local fixture: chart and table show the same one-decimal aggregates", async ({ page }, testInfo) => {
  await page.route("**/api/feedback", (route) => route.fulfill({ json: [
    { talkId: "Engineering bots", average: 4.3, count: 4 },
    { talkId: "Reliable tests", average: 3, count: 2 },
  ] }));
  await page.goto("/");
  const table = page.getByRole("table", { name: "Talk feedback summary" });
  const first = table.getByRole("row").filter({ hasText: "Engineering bots" });
  await expect(first.getByRole("cell", { name: /^4\.3\s*\/ 5$/ })).toBeVisible();
  await expect(first.getByRole("cell", { name: "4", exact: true })).toBeVisible();
  await expect(table.getByRole("row").filter({ hasText: "Reliable tests" }).getByRole("cell", { name: /^3\.0\s*\/ 5$/ })).toBeVisible();
  const chart = page.getByRole("figure", { name: "Average ratings by talk, from 0 to 5" });
  await expect(chart).toBeVisible();
  await expect(chart.getByText("4.3", { exact: true })).toBeVisible();
  await expect(chart.getByText("3.0", { exact: true })).toBeVisible();
  // Inspect SVG geometry only for the chart's quantitative encoding, not React internals.
  const bars = chart.locator(".recharts-bar-rectangle path");
  await expect(bars).toHaveCount(2);
  const taller = await bars.nth(0).boundingBox();
  const shorter = await bars.nth(1).boundingBox();
  expect(taller?.height).toBeGreaterThan(0);
  expect(shorter?.height).toBeGreaterThan(0);
  expect(taller!.height / shorter!.height).toBeCloseTo(4.3 / 3, 2);
  await page.screenshot({ path: testInfo.outputPath("two-talks-local-fixture.png"), fullPage: true });
});

test("local fixture: dashboard failure can be retried", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/feedback", (route) => {
    requests++;
    return requests === 1
      ? route.fulfill({ status: 503, body: "Unavailable" })
      : route.fulfill({ json: [] });
  });
  await page.goto("/");
  await expect(page.locator("#results").getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No feedback yet" })).toBeVisible();
});

test("local fixture: failed server retains inputs and re-enables submission", async ({ page }) => {
  const api = await fixture(page);
  api.fail();
  await page.goto("/");
  await fill(page);
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  await expect(page.locator("#feedback").getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Talk", { exact: true })).toHaveValue("  Engineering bots  ");
  await expect(page.getByLabel("Comment", { exact: true })).toHaveValue("  Useful examples  ");
  await expect(page.getByRole("radio", { name: "5", exact: true })).toBeChecked();
  await expect(page.getByRole("button", { name: "Send feedback", exact: true })).toBeEnabled();
  expect(api.created).toHaveLength(0);
});
