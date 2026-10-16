import { expect, test } from "@playwright/test";
import { summarize } from "../src/lib/stats";

// Local intercepted API fixtures only: no Neon, preview or persistence evidence.
const baseline = process.env.RESULTS_BASELINE === "1";
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
      await page.goto("/");
      const results = page.locator("#results");
      await expect(results.getByRole(count ? "table" : "heading", { name: count ? "Talk feedback summary" : "No feedback yet" })).toBeVisible();
      if (!baseline && count) {
        await expect(results.locator(".dashboard-bar-fill")).toHaveCount(count);
        await expect(results.getByRole("rowheader", { name: rows[0].talkId, exact: true })).toBeVisible();
        await expect(results.locator(".dashboard-bar-average").first()).toHaveText("4.3");
        await expect.poll(async () => {
          const fill = await results.locator(".dashboard-bar-fill").first().boundingBox();
          const track = await results.locator(".dashboard-bar-track").first().boundingBox();
          return fill!.width / track!.width;
        }).toBeCloseTo(4.3 / 5, 2);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: info.outputPath(`${baseline ? "baseline" : "redesign"}-${count}-talks-${width}-local-fixture.png`), fullPage: true });
    });
  }
}

test("local fixture: reduced motion, reflow, settled motion and keyboard retry", async ({ page }, info) => {
  test.skip(baseline, "Redesign interactions only");
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let state: "pending" | "ready" | "error" = "pending";
  let release: (() => void) | undefined;
  await page.route("**/api/feedback", async route => {
    if (route.request().method() === "POST") {
      state = "error";
      await route.fulfill({ status: 201, json: { id: 1, ...route.request().postDataJSON(), comment: "", createdAt: new Date().toISOString() } });
      return;
    }
    if (state === "pending") await new Promise<void>(resolve => { release = resolve; });
    await route.fulfill(state === "error" ? { status: 503, body: "Unavailable" } : { json: summarize([
      { talkId: "Talk A", rating: 4 }, { talkId: "talk a", rating: 4 },
      { talkId: "Talk A", rating: 4 }, { talkId: "talk a", rating: 5 },
    ]) });
  });
  await page.goto("/");
  const results = page.locator("#results");
  await expect(results.getByRole("status")).toHaveText("Loading feedback.");
  await expect(results.locator(".dashboard-skeleton")).toHaveAttribute("aria-hidden", "true");
  expect(await results.locator(".dashboard-skeleton").evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0);
  await page.screenshot({ path: info.outputPath("slow-loading-reduced-local-fixture.png"), fullPage: true });
  state = "ready";
  await expect.poll(() => Boolean(release)).toBe(true);
  release!();
  await expect(results.getByRole("rowheader", { name: "Talk A", exact: true })).toBeVisible();
  await expect(results.locator(".dashboard-bar-average")).toHaveText("4.3");
  expect(await results.locator(".dashboard-bar-fill").evaluate(node => node.getAnimations().length)).toBe(0);
  await page.getByLabel("Talk", { exact: true }).fill("Talk A");
  await page.getByLabel("Your name", { exact: true }).fill("Ana");
  await page.getByRole("radio", { name: "5 stars", exact: true }).check();
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  await expect(results.getByRole("alert")).toContainText("Feedback saved. Results could not refresh");
  await expect(results.getByText(/Previously loaded results/)).toBeVisible();
  await page.screenshot({ path: info.outputPath("saved-refresh-failed-local-fixture.png"), fullPage: true });
  const retry = results.getByRole("button", { name: "Try again", exact: true });
  await retry.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(retry).toBeFocused();
  await expect(retry).toHaveCSS("outline-style", "solid");
  state = "ready";
  await page.keyboard.press("Enter");
  await expect(results.getByRole("alert")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("320-reflow-local-fixture.png"), fullPage: true });
  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("200-percent-zoom-local-fixture.png"), fullPage: true });
});

test("local fixture: normal motion runs once and stops after settling", async ({ page }) => {
  test.skip(baseline, "Redesign motion only");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  let count = 1;
  let average = 3;
  await page.route("**/api/feedback", route => {
    if (route.request().method() === "POST") {
      count++;
      return route.fulfill({ status: 201, json: { id: count, ...route.request().postDataJSON(), comment: "", createdAt: new Date().toISOString() } });
    }
    return route.fulfill({ json: [{ talkId: "A talk", average, count }] });
  });
  await page.goto("/");
  const bar = page.locator(".dashboard-bar-fill");
  await expect(bar).toBeVisible();
  await expect(bar).toHaveCSS("animation-duration", "0.24s");
  await expect(page.locator(".dashboard-figure")).toHaveCSS("animation-duration", "0.16s");
  await expect.poll(() => bar.evaluate(node => node.getAnimations().filter(animation => animation.playState === "running").length)).toBe(0);
  await bar.evaluate(node => node.setAttribute("data-before-refresh", "true"));
  await page.evaluate(() => {
    document.body.dataset.barAnimations = "0";
    document.addEventListener("animationstart", event => {
      if (event.target instanceof Element && event.target.classList.contains("dashboard-bar-fill")) {
        document.body.dataset.barAnimations = String(Number(document.body.dataset.barAnimations) + 1);
      }
    });
  });
  const submit = async () => {
    await page.getByLabel("Talk", { exact: true }).fill("A talk");
    await page.getByLabel("Your name", { exact: true }).fill("Ana");
    await page.getByRole("radio", { name: "5 stars", exact: true }).check();
    await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  };
  await submit();
  await expect(page.locator(".dashboard-count")).toHaveText("2");
  await expect(bar).toHaveAttribute("data-before-refresh", "true");
  expect(await page.evaluate(() => document.body.dataset.barAnimations)).toBe("0");
  average = 4;
  await submit();
  await expect(page.locator(".dashboard-bar-average")).toHaveText("4.0");
  await expect(bar).not.toHaveAttribute("data-before-refresh");
  await expect.poll(() => page.evaluate(() => document.body.dataset.barAnimations)).toBe("1");
  await expect.poll(() => bar.evaluate(node => node.getAnimations().filter(animation => animation.playState === "running").length)).toBe(0);
});
