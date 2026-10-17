import { expect, test } from "@playwright/test";

test("home has a company header while working routes retain the 232px desktop sidebar", async ({ page }, info) => {
  await page.route("**/api/feedback", route => route.fulfill({ json: [] }));
  await page.route("**/api/feedback/insights?*", route => route.fulfill({ status: 503 }));
  for (const [width, height] of [[1440, 1000], [390, 844], [320, 800]]) {
    await page.setViewportSize({ width, height });
    for (const path of ["/", "/feedback", "/results"]) {
      await page.goto(path);
      await expect(page.locator("body")).not.toContainText("Loop Engineering");
      await expect(page.locator('[aria-label*="Loop Engineering"]')).toHaveCount(0);
      const nav = page.getByRole("navigation", { name: "Main navigation" });
      const sidebar = page.locator(".loop-sidebar");
      if (path === "/") {
        await expect(sidebar).toHaveCount(0);
        await expect(page.locator(".company-header")).toBeVisible();
        await expect(page.locator(".loop-topbar")).toHaveCount(0);
        await expect(page.getByRole("figure", { name: "An illustration of the feedback experience" })).toContainText("Illustrative preview. No live workshop data.");
        if (width === 1440) expect((await page.locator(".company-header").boundingBox())!.height).toBeLessThanOrEqual(80);
      } else {
        await expect(sidebar).toBeVisible();
        await expect(page.locator(".company-header")).toHaveCount(0);
        if (width === 1440) expect((await sidebar.boundingBox())!.width).toBe(232);
      }
      for (const link of await nav.getByRole("link").all()) await expect(link).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: info.outputPath(`${path.slice(1) || "home"}-${width}.png`), fullPage: true });
    }
  }
});


test("company banner keeps text steady while the original team responds to the pointer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1 });
  const original = await heading.boundingBox();
  await page.mouse.move(0, 400);
  const face = page.locator('[data-bot="grok"] .mascot-face');
  await expect.poll(() => face.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m41)).toBeLessThan(-2);
  await page.mouse.move(1439, 400);
  await expect.poll(() => face.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m41)).toBeGreaterThan(2);
  expect(await heading.boundingBox()).toEqual(original);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const element of await page.locator("[data-bot-depth]").all()) await expect(element).toHaveCSS("transform", "none");
  await expect(page.locator(".company-parallax-art")).toHaveCSS("animation-name", "none");
});

test("the decorative banner gains scroll depth and follows motion preference changes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  test.skip(!await page.evaluate(() => CSS.supports("animation-timeline", "view()")), "Native scroll timelines are progressive enhancement");
  const artwork = page.locator(".company-parallax-art");
  await expect(artwork).toHaveCSS("animation-name", "company-art-depth");
  const before = await artwork.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m42);
  await page.evaluate(() => window.scrollTo(0, 320));
  await expect.poll(async () => Math.abs(await artwork.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m42) - before)).toBeGreaterThan(3);
  await expect(page.locator(".company-hero-copy")).toHaveCSS("transform", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(artwork).toHaveCSS("animation-name", "none");
  await expect(artwork).toHaveCSS("transform", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(artwork).toHaveCSS("animation-name", "company-art-depth");
});

test("touch browsing keeps outer banner depth static", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/`);
    await page.evaluate(() => window.scrollTo(0, 250));
    await expect(page.locator(".company-parallax-art")).toHaveCSS("animation-name", "none");
    await expect(page.locator(".company-parallax-art")).toHaveCSS("transform", "none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await context.close(); }
});
