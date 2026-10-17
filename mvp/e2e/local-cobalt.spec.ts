import { expect, test, type Page } from "@playwright/test";
import { mockCobaltFeedback, fixtureTalks, insightFor } from "./fixtures/cobalt-feedback";

async function expectCobaltDistribution(page: Page) {
  const distribution = page.getByRole("list", { name: "Rating distribution" });
  const counts = [0, 0, 1, 5, 6];
  const percentages = ["0%", "0%", "8.3%", "41.7%", "50%"];
  await expect(distribution.getByRole("listitem")).toHaveCount(5);
  await expect(distribution.locator("strong")).toHaveText(counts.map(String));
  await expect(distribution.locator(".distribution-percentage")).toHaveText(percentages);
  for (let index = 0; index < counts.length; index++) {
    const rating = index + 1;
    await expect(distribution.getByRole("listitem").nth(index)).toHaveAttribute("aria-label", `${rating} ${rating === 1 ? "star" : "stars"}: ${counts[index]} ${counts[index] === 1 ? "rating" : "ratings"} (${percentages[index]})`);
  }
  const chart = page.locator(".results-analytics [data-slot=chart]");
  await expect(chart.locator(".recharts-surface")).toBeVisible();
  await expect(page.getByText("Individual ratings · counts by score", { exact: true })).toBeVisible();
  await expect(chart.locator(".recharts-xAxis .recharts-cartesian-axis-tick-value")).toHaveText(["1", "2", "3", "4", "5"]);
  // The SVG uses real response counts on a fixed 0..12 sample-count axis.
  // Zero bins retain their accessible labels without fabricating visible bars.
  await expect.poll(async () => chart.locator(".recharts-bar-rectangle").evaluateAll(nodes => nodes.map(node => (node as SVGGraphicsElement).getBBox()).filter(box => box.height > 0 && box.width > 0).length)).toBe(3);
  const geometry = await chart.evaluate(node => {
    const boxes = [...node.querySelectorAll<SVGGraphicsElement>(".recharts-bar-rectangle")].map(bar => bar.getBBox()).filter(box => box.height > 0 && box.width > 0).sort((a, b) => a.x - b.x);
    const levels = [...node.querySelectorAll(".recharts-cartesian-grid-horizontal line")].map(line => Number(line.getAttribute("y1")));
    return { bars: boxes.map(box => ({ x: box.x, y: box.y, height: box.height })), gridHeight: Math.max(...levels) - Math.min(...levels) };
  });
  expect(geometry.gridHeight).toBeGreaterThan(0);
  for (const [index, count] of [1, 5, 6].entries()) {
    expect(geometry.bars[index].height / geometry.gridHeight).toBeCloseTo(count / 12, 2);
    if (index) expect(geometry.bars[index].x).toBeGreaterThan(geometry.bars[index - 1].x);
  }
  expect(Math.abs(geometry.bars[0].y + geometry.bars[0].height - geometry.bars[2].y - geometry.bars[2].height)).toBeLessThan(1);
}

for (const width of [320, 390, 768, 1440]) {
  test(`cobalt results show real fixture distribution and comments at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await mockCobaltFeedback(page);
    await page.goto("/results");
    await expect(page.getByRole("list", { name: "Rating distribution" })).toBeVisible();
    await expect(page.locator(".results-total")).toHaveText("41");
    await expect(page.locator(".insight-score strong")).toHaveText("4.4");
    await expect(page.locator(".insight-score")).toContainText("92% rated 4 or 5");
    await expectCobaltDistribution(page);
    const comments = page.getByRole("list", { name: "Written feedback comments" });
    await expect(comments.locator("li p")).toHaveText(insightFor(fixtureTalks[0]).comments.map(comment => comment.text));
    await expect(comments.locator("time").first()).toHaveAttribute("datetime", "2026-10-16T14:02:00.000Z");
    await expect(comments.locator("time").first()).toHaveText("Oct 16, 2026");
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
  await expect(page.getByRole("list", { name: "Rating distribution" }).getByRole("listitem").last()).toHaveAttribute("aria-label", "5 stars: 7 ratings (53.8%)");
  await expect(page.locator(".rating-distribution li strong").last()).toHaveText("7");
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

test("rating distribution stays still with reduced motion and preserves exact data", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockCobaltFeedback(page);
  await page.goto("/results");
  await expectCobaltDistribution(page);
  expect(await page.locator(".results-analytics").evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("five nonzero rating bins fit at 320px and the Recharts keyboard focus stays visible", async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 844 });
  const talkId = "Every score represented";
  const rows = [1, 2, 3, 4, 5].map(rating => ({ talkId, rating, comment: "", createdAt: "2026-10-16T14:00:00.000Z" }));
  await page.route("**/api/feedback", route => route.fulfill({ json: [{ talkId, average: 3, count: 5 }] }));
  await page.route("**/api/feedback/insights?*", route => route.fulfill({ json: insightFor(talkId, rows) }));
  await page.goto("/results");
  const chart = page.locator(".results-analytics [data-slot=chart]");
  const surface = chart.locator(".recharts-surface");
  const bars = chart.locator(".recharts-bar-rectangle path");
  await expect(surface).toBeVisible();
  await expect(bars).toHaveCount(5);
  await expect(page.getByRole("list", { name: "Rating distribution" }).locator("strong")).toHaveText(["1", "1", "1", "1", "1"]);
  await page.evaluate(() => document.fonts.ready);
  const chartBox = await chart.boundingBox();
  const boxes = await Promise.all((await bars.all()).map(bar => bar.boundingBox()));
  for (const [index, box] of boxes.entries()) {
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
    expect(box!.x).toBeGreaterThanOrEqual(chartBox!.x - 0.5);
    expect(box!.x + box!.width).toBeLessThanOrEqual(chartBox!.x + chartBox!.width + 0.5);
    expect(box!.y).toBeGreaterThanOrEqual(chartBox!.y - 0.5);
    expect(box!.y + box!.height).toBeLessThanOrEqual(chartBox!.y + chartBox!.height + 0.5);
    if (index < boxes.length - 1) expect(box!.x + box!.width).toBeLessThanOrEqual(boxes[index + 1]!.x + 0.5);
  }
  await page.getByLabel("Explore a talk").focus();
  await page.keyboard.press("Tab");
  await expect(surface).toBeFocused();
  await expect(surface).toHaveCSS("outline-style", "solid");
  await expect(surface).toHaveCSS("outline-width", "2px");
  await expect(surface).toHaveCSS("outline-color", "rgb(36, 75, 232)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("five-nonzero-bins-keyboard-320.png"), fullPage: true });
});
