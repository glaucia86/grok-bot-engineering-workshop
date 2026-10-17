import { expect, test } from "@playwright/test";
import { fixtureTalks, mockCobaltFeedback, summaries } from "./fixtures/cobalt-feedback";
import { mockSparseFeedback, sparseRecords } from "./fixtures/sparse-feedback";

// Browser-local fixtures only. These checks never read from or write to Neon.
for (const width of [320, 390, 768, 1440]) {
  test(`results redesign: a wide rating panel above one comparison table and comments at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await mockCobaltFeedback(page);
    await page.goto("/results");
    const summary = page.getByLabel("Workshop response summary");
    await expect(summary).toBeVisible();
    await expect(summary.getByRole("term")).toHaveText(["Responses received", "Talks reviewed", "Most reviewed talk"]);
    await expect(summary.locator(".results-total")).toHaveText("41");
    await expect(summary.locator(":scope > div")).toHaveCount(3);
    await expect(summary.getByRole("definition").nth(1)).toHaveText("5");
    await expect(summary.getByRole("definition").nth(2)).toContainText(fixtureTalks[0]);
    await expect(summary.getByRole("definition").nth(2)).toContainText("12 ratings received");
    const analytics = page.getByRole("region", { name: "Selected talk feedback", exact: true });
    const comparison = page.getByRole("region", { name: "Across the workshop", exact: true });
    const comments = page.locator(".talk-comments");
    const bottom = page.locator(".results-bottom-grid");
    await expect(analytics).toHaveClass(/results-analytics/);
    await expect(analytics.locator(".results-analytics-header").getByRole("heading", { level: 3, name: fixtureTalks[0], exact: true })).toBeVisible();
    await expect(analytics.locator(".results-analytics-header").getByLabel("Explore a talk")).toBeVisible();
    await expect(analytics.getByRole("list", { name: "Rating distribution" })).toBeVisible();
    await expect(bottom.locator(".results-comparison")).toHaveCount(1);
    await expect(bottom.locator(".talk-comments")).toHaveCount(1);
    await expect(page.getByRole("table")).toHaveCount(1);
    const table = comparison.getByRole("table", { name: "Talk feedback summary" });
    await expect(table.getByRole("columnheader")).toHaveText(["Talk", "Average", "Responses"]);
    await expect(table.locator(".dashboard-average")).toHaveText(summaries.map(talk => new RegExp(`^${talk.average.toFixed(1).replace(".", "\\.")}\\s*\\/ 5$`)));
    await expect(table.locator(".dashboard-count")).toHaveText(summaries.map(talk => String(talk.count)));
    await expect(table.getByRole("button")).toHaveText(fixtureTalks);
    await expect(page.getByRole("list", { name: "Written feedback comments" })).toBeVisible();
    await expect(comments).toContainText("3 comments");
    await expect(page.locator(".dashboard-bar-fill, .dashboard-bars, .dashboard-table-wrap")).toHaveCount(0);
    const summaryBox = await summary.boundingBox();
    const analyticsBox = await analytics.boundingBox();
    const bottomBox = await bottom.boundingBox();
    const compareBox = await comparison.boundingBox();
    const commentsBox = await comments.boundingBox();
    expect(summaryBox!.y + summaryBox!.height).toBeLessThanOrEqual(analyticsBox!.y + 1);
    expect(analyticsBox!.y + analyticsBox!.height).toBeLessThanOrEqual(bottomBox!.y + 1);
    expect(Math.abs(analyticsBox!.width - bottomBox!.width)).toBeLessThan(2);
    if (width === 1440) {
      expect(compareBox!.x + compareBox!.width).toBeLessThanOrEqual(commentsBox!.x);
      expect(Math.abs(compareBox!.y - commentsBox!.y)).toBeLessThan(2);
    } else if (width <= 390) {
      expect(compareBox!.y + compareBox!.height).toBeLessThanOrEqual(commentsBox!.y);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: info.outputPath(`results-rich-redesign-${width}.png`), fullPage: true });
  });
}

for (const width of [320, 390, 1440]) {
  test(`results redesign: two one-response talks remain honest and readable at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await mockSparseFeedback(page);
    await page.goto("/results");
    const summary = page.getByLabel("Workshop response summary");
    await expect(summary.locator(".results-total")).toHaveText("2");
    await expect(summary.getByRole("definition").nth(1)).toHaveText("2");
    await expect(summary.getByRole("term").nth(2)).toHaveText("Most reviewed talks");
    await expect(summary.getByRole("definition").nth(2)).toHaveText("2 tied1 rating each");
    const analytics = page.getByRole("region", { name: "Selected talk feedback", exact: true });
    await expect(analytics.getByRole("heading", { name: "Workshop kickoff", exact: true })).toBeVisible();
    await expect(analytics.locator(".insight-score strong")).toHaveText("5.0");
    await expect(analytics.getByText("Based on 1 response. This is an early signal.", { exact: true })).toBeVisible();
    const distribution = analytics.getByRole("list", { name: "Rating distribution" });
    await expect(distribution.getByRole("listitem")).toHaveCount(5);
    await expect(distribution.locator("strong")).toHaveText(["0", "0", "0", "0", "1"]);
    await expect(distribution.getByRole("listitem").last()).toHaveAttribute("aria-label", "5 stars: 1 rating (100%)");
    await expect(distribution.locator(".distribution-percentage")).toHaveText(["0%", "0%", "0%", "0%", "100%"]);
    const table = page.getByRole("table", { name: "Talk feedback summary" });
    await expect(table.getByRole("button")).toHaveText(sparseRecords.map(row => row.talkId));
    await expect(table.locator(".dashboard-average")).toHaveText([/^5\.0\s*\/ 5$/, /^4\.0\s*\/ 5$/]);
    await expect(table.locator(".dashboard-count")).toHaveText(["1", "1"]);
    await expect(page.locator(".talk-comments")).toContainText("1 comment");
    await expect(page.getByRole("list", { name: "Written feedback comments" }).getByRole("listitem")).toHaveCount(1);
    await expect(page.locator(".talk-comments time")).toHaveAttribute("datetime", sparseRecords[0].createdAt);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: info.outputPath(`results-sparse-redesign-${width}.png`), fullPage: true });

    const nextTalk = table.getByRole("button", { name: "Building useful agents", exact: true });
    await nextTalk.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Explore a talk")).toBeFocused();
    await expect(nextTalk).toHaveAttribute("aria-pressed", "true");
    await expect(analytics.locator(".insight-score strong")).toHaveText("4.0");
    await expect(distribution.locator("strong")).toHaveText(["0", "0", "0", "1", "0"]);
    await expect(distribution.getByRole("listitem").nth(3)).toHaveAttribute("aria-label", "4 stars: 1 rating (100%)");
    await expect(page.getByText("No written comments yet.")).toBeVisible();
    await expect(page.locator(".talk-comments")).toContainText("0 comments");
    await expect(analytics.getByText("Based on 1 response. This is an early signal.", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("results redesign: larger workshops keep the table bounded and keyboard selection visible", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const talks = Array.from({ length: 20 }, (_, index) => ({ talkId: `Talk ${index + 1}: engineering dependable tools`, average: index === 0 ? 4.3 : 3, count: index + 1 }));
  await page.route("**/api/feedback", route => route.fulfill({ json: talks }));
  await page.route("**/api/feedback/insights?*", route => route.fulfill({ status: 503 }));
  await page.goto("/results");
  const scroll = page.locator(".comparison-scroll");
  await expect(scroll).toHaveAttribute("data-scroll", "true");
  await expect(scroll).toHaveAttribute("tabindex", "0");
  const dimensions = await scroll.evaluate(node => ({ height: node.clientHeight, scrollHeight: node.scrollHeight, overflow: getComputedStyle(node).overflowY, maxHeight: getComputedStyle(node).maxHeight }));
  expect(dimensions.height).toBeLessThanOrEqual(480);
  expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.height);
  expect(dimensions.overflow).toBe("auto");
  expect(dimensions.maxHeight).toBe("480px");
  await scroll.focus();
  await expect(scroll).toBeFocused();
  await expect(scroll).toHaveCSS("outline-style", "solid");
  await expect(scroll).toHaveCSS("outline-offset", "-2px");
  const button = scroll.getByRole("button", { name: talks[19].talkId, exact: true });
  await button.focus();
  await expect(button).toBeFocused();
  await expect(button).toHaveCSS("outline-style", "solid");
  await expect(button).toHaveCSS("outline-offset", "-2px");
  expect(await scroll.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Explore a talk")).toBeFocused();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: talks[19].talkId, exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("results redesign: six talks do not create an extra table scroll stop", async ({ page }) => {
  const talks = Array.from({ length: 6 }, (_, index) => ({ talkId: `Talk ${index + 1}`, average: 4, count: 1 }));
  await page.route("**/api/feedback", route => route.fulfill({ json: talks }));
  await page.route("**/api/feedback/insights?*", route => route.fulfill({ status: 503 }));
  await page.goto("/results");
  const scroll = page.locator(".comparison-scroll");
  await expect(scroll).not.toHaveAttribute("data-scroll");
  await expect(scroll).not.toHaveAttribute("tabindex");
  await expect(scroll.getByRole("button")).toHaveCount(6);
});

test("results redesign: small workshops select directly from their sole comparison table", async ({ page }) => {
  await mockCobaltFeedback(page);
  await page.goto("/results");
  const scroll = page.locator(".comparison-scroll");
  await expect(scroll).not.toHaveAttribute("data-scroll");
  await expect(scroll).not.toHaveAttribute("tabindex");
  await scroll.getByRole("button", { name: fixtureTalks[1], exact: true }).click();
  await expect(page.getByLabel("Explore a talk")).toBeFocused();
  await expect(page.locator(".insight-score strong")).toHaveText("4.8");
});
