import { expect, test } from "@playwright/test";
import { summarize } from "../src/lib/stats";

// Local intercepted API fixtures only: no Neon, preview or persistence evidence.
const sizes = [[320, 844], [390, 844], [768, 1024], [1440, 900]] as const;
for (const [width, height] of sizes) {
  for (const count of [0, 1, 5, 20]) {
    test(`local results fixture: ${count} talks at ${width}x${height}`, async ({ page }, info) => {
      await page.setViewportSize({ width, height });
      const rows = Array.from({ length: count }, (_, index) => ({
        talkId: index === 0 ? "Engineering reliable bots: a practical workshop with examples" : index === 1 ? "Unbroken".repeat(12) : `Talk ${index + 1}: building useful tools`,
        average: index === 0 ? 4.3 : 3, count: index + 1,
      }));
      await page.route("**/api/feedback", route => route.fulfill({ json: rows }));
      await page.goto("/results");
      const results = page.locator("#results");
      await expect(results.getByRole(count ? "table" : "heading", { name: count ? "Talk feedback summary" : "No feedback yet" })).toBeVisible();
      await expect(page.getByLabel("Talk", { exact: true })).toHaveCount(0);
      if (count) {
        await expect(results.locator(".dashboard-bar-fill")).toHaveCount(count);
        await expect(results.getByRole("rowheader", { name: rows[0].talkId, exact: true })).toBeVisible();
        await expect(results.locator(".dashboard-bar-average").first()).toHaveText("4.3");
        await expect.poll(async () => {
          const fill = await results.locator(".dashboard-bar-fill").first().boundingBox();
          const track = await results.locator(".dashboard-bar-track").first().boundingBox();
          return fill!.width / track!.width;
        }).toBeCloseTo(4.3 / 5, 2);
      } else {
        await expect(results.getByRole("link", { name: /Leave feedback/i })).toHaveAttribute("href", "/feedback");
        await expect(results.getByRole("table")).toHaveCount(0);
        await expect(results.locator(".dashboard-bar-fill")).toHaveCount(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect.poll(() => results.locator(".dashboard-bar-fill").evaluateAll(nodes => nodes.flatMap(node => node.getAnimations()).filter(animation => animation.playState === "running").length)).toBe(0);
      await page.screenshot({ path: info.outputPath(`${count}-talks-${width}-local-fixture.png`), fullPage: true });
    });
  }
}

test("local results fixture: pending retrieval, reduced motion and 320px reflow", async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let release: (() => void) | undefined;
  await page.route("**/api/feedback", async route => {
    await new Promise<void>(resolve => { release = resolve; });
    await route.fulfill({ json: summarize([
      { talkId: "Talk A", rating: 4 }, { talkId: "talk a", rating: 4 },
      { talkId: "Talk A", rating: 4 }, { talkId: "talk a", rating: 5 },
    ]) });
  });
  await page.goto("/results");
  const results = page.locator("#results");
  await expect(results.getByRole("status")).toHaveText("Loading feedback.");
  await expect(results.locator(".dashboard-skeleton")).toHaveAttribute("aria-hidden", "true");
  await expect(results.getByRole("table")).toHaveCount(0);
  await expect(results.getByRole("heading", { name: "No feedback yet" })).toHaveCount(0);
  expect(await results.locator(".dashboard-skeleton").evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0);
  await page.screenshot({ path: info.outputPath("slow-loading-reduced-local-fixture.png"), fullPage: true });
  await expect.poll(() => Boolean(release)).toBe(true);
  release!();
  await expect(results.getByRole("rowheader", { name: "Talk A", exact: true })).toBeVisible();
  await expect(results.locator(".dashboard-bar-average")).toHaveText("4.3");
  expect(await results.locator(".dashboard-bar-fill").evaluate(node => node.getAnimations().length)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("320-reflow-local-fixture.png"), fullPage: true });
  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("200-percent-zoom-local-fixture.png"), fullPage: true });
});

// Post-save refresh races remain in dashboard unit tests. With separate routes,
// initial retrieval failure/retry is the browser-visible recovery contract.
test("local results fixture: initial retrieval failure has no fabricated results and supports keyboard retry", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let fail = true;
  await page.route("**/api/feedback", route => fail
    ? route.fulfill({ status: 503, body: "Unavailable" })
    : route.fulfill({ json: [{ talkId: "Recovered talk", average: 5, count: 1 }] }));
  await page.goto("/results");
  const results = page.locator("#results");
  await expect(results.getByRole("alert")).toContainText("We couldn't load the feedback");
  await expect(results.getByRole("table")).toHaveCount(0);
  await expect(results.getByRole("heading", { name: "No feedback yet" })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("initial-error-local-fixture.png"), fullPage: true });
  const retry = results.getByRole("button", { name: "Try again", exact: true });
  await retry.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(retry).toBeFocused();
  await expect(retry).toHaveCSS("outline-style", "solid");
  fail = false;
  await page.keyboard.press("Enter");
  await expect(results.getByRole("alert")).toHaveCount(0);
  await expect(results.getByRole("rowheader", { name: "Recovered talk" })).toBeVisible();
});

test("local results fixture: normal motion runs once and stops after settling on route entry", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/api/feedback", route => route.fulfill({ json: [{ talkId: "A talk", average: 3, count: 1 }] }));
  await page.goto("/results");
  const bar = page.locator(".dashboard-bar-fill");
  await expect(bar).toBeVisible();
  await expect(bar).toHaveCSS("animation-duration", "0.24s");
  await expect(page.locator(".dashboard-figure")).toHaveCSS("animation-duration", "0.16s");
  await expect.poll(() => bar.evaluate(node => node.getAnimations().filter(animation => animation.playState === "running").length)).toBe(0);
  const animation = await bar.evaluate(node => getComputedStyle(node).animationIterationCount);
  expect(animation).toBe("1");
});

// These pre-existing scenarios provide aggregate-only fixtures. Explicitly
// isolate the new detail read too; no request should reach a real database.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/feedback/insights?*", route => route.fulfill({ status: 503, body: "Details outside this aggregate-only fixture" }));
});
