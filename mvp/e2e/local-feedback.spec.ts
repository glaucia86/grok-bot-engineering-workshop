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
  await page.getByLabel("Comment (optional)", { exact: true }).fill("  Useful examples  ");
  await page.getByRole("radio", { name: rating === "1" ? "1 star" : `${rating} stars`, exact: true }).check();
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
  for (const message of ["talkId is required", "rating must be a number"]) {
    await expect(page.locator("#feedback").getByText(message, { exact: true })).toBeVisible();
  }
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("Ana");
  expect(api.created).toHaveLength(0);
  await fill(page);
  await page.getByLabel("Comment (optional)", { exact: true }).fill(`  ${"x".repeat(1001)}  `);
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  await expect(page.getByText("comment must be at most 1000 characters", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Comment (optional)", { exact: true })).toHaveValue(`  ${"x".repeat(1001)}  `);
  expect(api.created).toHaveLength(0);
  await page.getByLabel("Comment (optional)", { exact: true }).fill("  Useful examples  ");
  await page.getByRole("radio", { name: "4 stars", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "5 stars", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  await expect(page.getByText("Feedback saved", { exact: false })).toBeVisible();
  expect(api.created).toEqual([{ talkId: "Engineering bots", author: "Ana", comment: "Useful examples", rating: 5 }]);
  for (const label of ["Talk", "Your name", "Comment (optional)"]) await expect(page.getByLabel(label, { exact: true })).toHaveValue("");
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
  await expect(page.getByLabel("Comment (optional)", { exact: true })).toHaveValue("  Useful examples  ");
  await expect(page.getByRole("radio", { name: "5 stars", exact: true })).toBeChecked();
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeEnabled();
  expect(api.created).toHaveLength(0);
});

test("local fixture: required stars support keyboard, focus, shape cues and optional comments", async ({ page }, testInfo) => {
  const api = await fixture(page);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  const group = page.getByRole("group", { name: "Rating", exact: true });
  const stars = group.getByRole("radio");
  const first = group.getByRole("radio", { name: "1 star", exact: true });
  const fourth = group.getByRole("radio", { name: "4 stars", exact: true });
  const fifth = group.getByRole("radio", { name: "5 stars", exact: true });
  const comment = page.getByLabel("Comment (optional)", { exact: true });
  await expect(stars).toHaveCount(5);
  await expect(group.getByRole("radio", { checked: true })).toHaveCount(0);
  await expect(comment).not.toHaveAttribute("required", "");
  await expect(page.getByText("All fields are required.")).toHaveCount(0);
  await page.getByLabel("Talk", { exact: true }).fill("Engineering bots");
  await page.getByLabel("Your name", { exact: true }).fill("Ana");
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  await expect(page.getByText("rating must be a number", { exact: true })).toBeVisible();
  await expect(first).toBeFocused();
  await expect(first).toHaveAttribute("aria-describedby", /rating-error/);
  expect(api.created).toHaveLength(0);
  await page.keyboard.press("Space");
  await expect(first).toBeChecked();
  await page.keyboard.press("ArrowLeft");
  await expect(fifth).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(first).toBeChecked();
  for (let step = 0; step < 3; step++) await page.keyboard.press("ArrowRight");
  await expect(fourth).toBeChecked();
  await expect(group.getByRole("radio", { checked: true })).toHaveCount(1);
  await expect(page.getByText("4 of 5 stars selected", { exact: true })).toBeVisible();
  // Inspect the visible cues: four filled star shapes, one outline, no numeric buttons.
  const shapes = group.locator("svg");
  await expect(shapes).toHaveCount(5);
  for (let index = 0; index < 4; index++) await expect(shapes.nth(index)).toHaveAttribute("fill", "currentColor");
  await expect(shapes.nth(4)).toHaveAttribute("fill", "none");
  for (const number of ["1", "2", "3", "4", "5"]) await expect(group.getByText(number, { exact: true })).toHaveCount(0);
  const focusTarget = fourth.locator("..").locator("span");
  await expect(focusTarget).toHaveCSS("outline-style", "solid");
  await expect(focusTarget).toHaveCSS("outline-width", "2px");
  for (const star of await stars.all()) {
    const box = await star.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("stars-keyboard-mobile.png"), fullPage: true });
  await page.emulateMedia({ forcedColors: "active" });
  await expect(focusTarget).toHaveCSS("outline-style", "solid");
  await expect(focusTarget).toHaveCSS("outline-width", "2px");
  await page.screenshot({ path: testInfo.outputPath("stars-forced-colors.png"), fullPage: true });
  await page.emulateMedia({ forcedColors: "none" });
  await page.keyboard.press("Tab");
  await expect(comment).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(fourth).toBeFocused();
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  await expect(page.getByText("Feedback saved", { exact: false })).toBeVisible();
  expect(api.created).toEqual([{ talkId: "Engineering bots", author: "Ana", comment: "", rating: 4 }]);
  await expect(group.getByRole("radio", { checked: true })).toHaveCount(0);
  await expect(page.getByText("No rating selected", { exact: true })).toBeVisible();

  await fill(page, "Engineering bots", "3");
  await comment.fill(" \t\n ");
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  await expect(page.getByText("Feedback saved", { exact: false })).toBeVisible();
  expect(api.created).toEqual([
    { talkId: "Engineering bots", author: "Ana", comment: "", rating: 4 },
    { talkId: "Engineering bots", author: "Ana", comment: "", rating: 3 },
  ]);
});
