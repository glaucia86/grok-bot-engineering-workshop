import { expect, test, type Page } from "@playwright/test";
import { feedbackSchema, fieldErrors } from "../src/lib/feedback-schema";
import { summarize } from "../src/lib/stats";

async function submit(page: Page, talk = "Engineering reliable bots: a practical workshop with examples") {
  await page.getByLabel("Talk", { exact: true }).fill(`  ${talk}  `);
  await page.getByLabel("Your name", { exact: true }).fill("  Integration attendee  ");
  await page.getByRole("radio", { name: "4 stars", exact: true }).check();
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
}

// The old combined-page races are component-unit coverage now. These browser
// checks exercise the actual separate-route lifecycle and its fresh GET on entry.
// Fixture rows survive navigation/reload in this test process, not in a database.
for (const width of [390, 1440]) {
  test(`local journey fixture: save stays on form, explicit results, reload and back at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.emulateMedia({ reducedMotion: width === 390 ? "reduce" : "no-preference" });
    const rows: { talkId: string; rating: number }[] = [];
    let gets = 0;
    let posts = 0;
    await page.route("**/api/feedback", async route => {
      if (route.request().method() === "GET") {
        gets++;
        return route.fulfill({ json: summarize(rows) });
      }
      posts++;
      const parsed = feedbackSchema.safeParse(route.request().postDataJSON());
      if (!parsed.success) return route.fulfill({ status: 400, json: { errors: fieldErrors(parsed.error) } });
      rows.push(parsed.data);
      return route.fulfill({ status: 201, json: { id: posts, ...parsed.data, createdAt: "2026-01-01T00:00:00.000Z" } });
    });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Leave feedback", exact: true }).click();
    await expect(page).toHaveURL(/\/feedback$/);
    const longName = "Engineering reliable bots: a practical workshop with examples";
    await submit(page, longName);
    await expect(page.getByText(/Feedback saved/)).toBeVisible();
    await expect(page).toHaveURL(/\/feedback$/);
    await expect(page.locator("#results")).toHaveCount(0);
    expect(gets).toBe(0);
    expect(posts).toBe(1);
    expect(rows).toEqual([{ talkId: longName, author: "Integration attendee", comment: "", rating: 4 }]);
    await page.getByRole("link", { name: "View results", exact: true }).click();
    await expect(page).toHaveURL(/\/results$/);
    const results = page.locator("#results");
    await expect(results.getByRole("rowheader", { name: longName, exact: true })).toBeVisible();
    await expect(results.locator(".dashboard-count")).toHaveText("1");
    await expect(results.locator(".dashboard-bar-average")).toHaveText("4.0");
    await expect(page.getByLabel("Talk", { exact: true })).toHaveCount(0);
    await page.reload();
    await expect(results.getByRole("rowheader", { name: longName, exact: true })).toBeVisible();
    await expect(results.locator(".dashboard-count")).toHaveText("1");
    expect(gets).toBeGreaterThanOrEqual(2);
    expect(posts).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390) expect(await results.locator(".dashboard-bar-fill").evaluate(node => node.getAnimations().length)).toBe(0);
    await expect.poll(() => results.locator(".dashboard-bar-fill").evaluateAll(nodes => nodes.flatMap(node => node.getAnimations()).filter(animation => animation.playState === "running").length)).toBe(0);
    await page.screenshot({ path: info.outputPath(`journey-results-${width}-local-fixture.png`), fullPage: true });
    await page.goBack();
    await expect(page).toHaveURL(/\/feedback$/);
    await expect(page.getByLabel("Talk", { exact: true })).toBeVisible();
    await expect(page.locator("#results")).toHaveCount(0);
  });
}

test("local journey fixture: saved contribution survives results retrieval failure and keyboard retry", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  let saved = false;
  let failResults = true;
  let posts = 0;
  await page.route("**/api/feedback", route => {
    if (route.request().method() === "POST") {
      saved = true;
      posts++;
      return route.fulfill({ status: 201, json: { id: 1, ...route.request().postDataJSON(), createdAt: "2026-01-01T00:00:00.000Z" } });
    }
    return failResults ? route.fulfill({ status: 503, body: "Unavailable" })
      : route.fulfill({ json: saved ? [{ talkId: "First saved talk", average: 4, count: 1 }] : [] });
  });
  await page.goto("/feedback");
  await submit(page, "First saved talk");
  await expect(page.getByText(/Feedback saved/)).toBeVisible();
  await page.getByRole("link", { name: "View results", exact: true }).click();
  const results = page.locator("#results");
  await expect(results.getByRole("alert")).toContainText("We couldn't load the feedback");
  await expect(results.getByRole("table")).toHaveCount(0);
  await expect(results.getByRole("heading", { name: "No feedback yet" })).toHaveCount(0);
  failResults = false;
  await results.getByRole("button", { name: "Try again", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(results.getByRole("rowheader", { name: "First saved talk" })).toBeVisible();
  expect(posts).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
