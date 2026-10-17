import { expect, test } from "@playwright/test";
import { mockCobaltFeedback, fixtureTalks, insightFor } from "./fixtures/cobalt-feedback";
for (const width of [320, 390, 768, 1440]) {
  test(`cobalt results show real fixture distribution and comments at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await mockCobaltFeedback(page);
    await page.goto("/results");
    await expect(page.getByRole("list", { name: "Rating distribution" })).toBeVisible();
    await expect(page.locator(".results-total")).toHaveText("41");
    await expect(page.locator(".insight-score strong")).toHaveText("4.4");
    await expect(page.locator(".insight-score")).toContainText("92% rated 4 or 5");
    expect(await page.locator(".rating-distribution li strong").allTextContents()).toEqual(["6", "5", "1", "0", "0"]);
    await expect(page.locator(".talk-comments li")).toHaveCount(3);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`results-cobalt-${width}.png`), fullPage: true });
    const selector = page.getByLabel("Explore a talk");
    await selector.focus();
    await page.keyboard.press("End"); await page.keyboard.press("Enter");
    await expect(selector).toHaveValue(fixtureTalks[4]);
    await expect(page.getByText("No written comments yet.")).toBeVisible();
    await expect(page.locator(".insight-score strong")).toHaveText("3.8");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("detail failure preserves summary, retries separately and clears old comments while a new talk loads", async ({ page }, info) => {
  await mockCobaltFeedback(page);
  let fail = true;
  await page.route("**/api/feedback/insights?*", route => fail ? route.fulfill({ status: 503 }) : route.fulfill({ json: insightFor(new URL(route.request().url()).searchParams.get("talkId")!) }));
  await page.goto("/results");
  await expect(page.getByRole("button", { name: "Retry details" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Talk feedback summary" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("details-error.png"), fullPage: true });
  fail = false;
  await page.getByRole("button", { name: "Retry details" }).click();
  await expect(page.locator(".talk-comments li")).toHaveCount(3);
  let release: (() => void) | undefined;
  await page.route("**/api/feedback/insights?*", async route => {
    await new Promise<void>(resolve => { release = resolve; });
    await route.fulfill({ json: insightFor(new URL(route.request().url()).searchParams.get("talkId")!) });
  });
  await page.getByLabel("Explore a talk").selectOption(fixtureTalks[1]);
  await expect(page.getByText("Loading rating details.")).toBeVisible();
  await expect(page.locator(".talk-comments li")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("details-loading.png"), fullPage: true });
  await expect.poll(() => Boolean(release)).toBe(true); release!();
  await expect(page.locator(".talk-comments li")).toHaveCount(2);
  await expect(page.locator(".insight-score strong")).toHaveText("4.8");
});

test("saved feedback appears in the chosen talk's distribution and comments after navigation and reload", async ({ page }) => {
  const { records } = await import("./fixtures/cobalt-feedback");
  const { summarize } = await import("../src/lib/stats");
  const live = records.map(row => ({ ...row }));
  await page.route("**/api/feedback", async route => {
    if (route.request().method() === "POST") {
      const data = route.request().postDataJSON();
      const row = { ...data, createdAt: "2026-10-17T12:00:00Z" };
      live.push(row);
      await route.fulfill({ status: 201, json: { ...row, id: 100 } });
    } else await route.fulfill({ json: summarize(live) });
  });
  await page.route("**/api/feedback/insights?*", route => route.fulfill({ json: insightFor(new URL(route.request().url()).searchParams.get("talkId")!, live) }));
  await page.goto("/feedback");
  await page.getByLabel("Talk", { exact: true }).fill(fixtureTalks[0]);
  await page.getByLabel("Your name", { exact: true }).fill("Local fixture attendee");
  await page.getByRole("radio", { name: "5 stars", exact: true }).check();
  await page.getByLabel("Comment (optional)", { exact: true }).fill("My newly saved fixture comment.");
  await page.getByRole("button", { name: "Send feedback" }).click();
  await page.getByRole("link", { name: "View results", exact: true }).click();
  await expect(page.getByText("My newly saved fixture comment.", { exact: true })).toBeVisible();
  await expect(page.locator(".results-total")).toHaveText("42");
  await expect(page.locator(".rating-distribution li strong").first()).toHaveText("7");
  await page.reload();
  await expect(page.getByText("My newly saved fixture comment.", { exact: true })).toBeVisible();
});

test("mobile comparison returns focus and viewport to the selected talk", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockCobaltFeedback(page);
  await page.goto("/results");
  await expect(page.locator(".talk-comments li")).toHaveCount(3);
  await page.getByRole("button", { name: fixtureTalks[1], exact: true }).click();
  await expect(page.getByLabel("Explore a talk")).toBeFocused();
  await expect(page.locator(".insight-score strong")).toHaveText("4.8");
  const box = await page.getByLabel("Explore a talk").boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  await page.screenshot({ path: info.outputPath("mobile-selected-talk-focus.png"), fullPage: true });
});
