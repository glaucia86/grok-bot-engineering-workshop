import { expect, test } from "@playwright/test";
import { fixtureTalks, mockCobaltFeedback } from "./fixtures/cobalt-feedback";

// Browser-local fixtures only. These checks never read from or write to Neon.
for (const width of [320, 390, 768, 1440]) {
  test(`results redesign: factual cards and readable panels at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await mockCobaltFeedback(page);
    await page.goto("/results");
    const summary = page.getByLabel("Workshop response summary");
    await expect(summary).toBeVisible();
    await expect(summary.getByRole("term")).toHaveText(["Responses received", "Talks reviewed", "Most reviewed talk"]);
    await expect(summary.locator(".results-total")).toHaveText("41");
    const cards = summary.locator(":scope > div");
    await expect(cards).toHaveCount(3);
    for (const card of await cards.all()) {
      await expect(card).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await expect(card).toHaveCSS("border-radius", "12px");
    }
    const comparison = page.getByRole("region", { name: "Across the workshop", exact: true });
    const detail = page.getByRole("complementary", { name: "Selected talk feedback" });
    await expect(page.getByRole("list", { name: "Written feedback comments" })).toBeVisible();
    await expect(page.locator(".talk-comments")).toContainText("3 comments");
    await expect(comparison).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(detail).toHaveCSS("background-color", "rgb(255, 255, 255)");
    const compareBox = await comparison.boundingBox();
    const detailBox = await detail.boundingBox();
    if (width === 1440) {
      expect(compareBox!.x).toBeLessThan(detailBox!.x);
      expect(compareBox!.width).toBeGreaterThan(detailBox!.width);
      expect(Math.abs(compareBox!.y - detailBox!.y)).toBeLessThan(2);
    } else {
      expect(detailBox!.y + detailBox!.height).toBeLessThanOrEqual(compareBox!.y);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: info.outputPath(`results-redesign-${width}.png`), fullPage: true });
  });
}

test("results redesign: larger workshops keep the chart bounded and keyboard selection visible", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const talks = Array.from({ length: 20 }, (_, index) => ({ talkId: `Talk ${index + 1}: engineering dependable tools`, average: index === 0 ? 4.3 : 3, count: index + 1 }));
  await page.route("**/api/feedback", route => route.fulfill({ json: talks }));
  await page.route("**/api/feedback/insights?*", route => route.fulfill({ status: 503 }));
  await page.goto("/results");
  const chart = page.getByRole("list", { name: "Average ratings and response counts" });
  await expect(chart).toHaveAttribute("data-scroll", "true");
  const dimensions = await chart.evaluate(node => ({ height: node.clientHeight, scrollHeight: node.scrollHeight, overflow: getComputedStyle(node).overflowY }));
  expect(dimensions.height).toBeLessThanOrEqual(560);
  expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.height);
  expect(dimensions.overflow).toBe("auto");
  await chart.focus();
  await expect(chart).toBeFocused();
  await expect(chart).toHaveCSS("outline-style", "solid");
  await expect(chart).toHaveCSS("outline-offset", "-2px");
  const button = page.getByRole("button", { name: talks[19].talkId, exact: true });
  await button.focus();
  await expect(button).toHaveCSS("outline-offset", "-2px");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Explore a talk")).toBeFocused();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: talks[19].talkId, exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("results redesign: small workshops do not create an extra chart scroll stop", async ({ page }) => {
  await mockCobaltFeedback(page);
  await page.goto("/results");
  const chart = page.getByRole("list", { name: "Average ratings and response counts" });
  await expect(chart).not.toHaveAttribute("data-scroll");
  await expect(chart).not.toHaveAttribute("tabindex");
  await page.getByRole("button", { name: fixtureTalks[1], exact: true }).click();
  await expect(page.getByLabel("Explore a talk")).toBeFocused();
  await expect(page.locator(".insight-score strong")).toHaveText("4.8");
});
