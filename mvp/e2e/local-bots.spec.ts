import { expect, test, type Page } from "@playwright/test";

async function settleFrames(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

test("native vector mascot is decorative, needs no raster resources and does not intercept controls", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const assets: number[] = [];
  page.on("response", response => { if (new URL(response.url()).pathname.startsWith("/bots/")) assets.push(response.status()); });
  await page.goto("/");
  const backdrop = page.locator(".bot-backdrop");
  await expect(backdrop).toHaveAttribute("aria-hidden", "true");
  await expect(backdrop).toHaveCSS("pointer-events", "none");
  await expect(backdrop.locator("[data-bot]")).toHaveCount(1);
  await expect(backdrop.locator(".mascot-art")).toBeVisible();
  expect(assets).toHaveLength(0);
  await expect(backdrop.locator("img, image, canvas, .bot-eye-lid")).toHaveCount(0);
  await expect(backdrop.getByRole("img")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("home-bots-desktop.png"), fullPage: true });
  await page.getByRole("main").getByRole("link", { name: "Leave feedback", exact: true }).click();
  await expect(page).toHaveURL(/\/feedback$/);
  await expect(page.getByLabel("Talk", { exact: true })).toBeVisible();
  await expect(page.locator(".bot-backdrop:visible")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".bot-backdrop")).toHaveCount(0);
});

test("mouse tracking is bounded and becomes static when reduced motion is enabled", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const bot = page.locator('[data-bot="grok"]');
  // Navigation can finish before React effects attach on a fast server. Repeat
  // actual mouse input while awaiting the response, without a hydration sleep.
  await expect.poll(async () => {
    await page.mouse.move(12, 12);
    await page.mouse.move(10, 10);
    return bot.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m41);
  }).toBeLessThan(-5);
  await page.screenshot({ path: info.outputPath("home-bots-pointer-left.png"), fullPage: true });
  await page.mouse.move(1270, 710);
  await expect.poll(() => bot.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m41)).toBeGreaterThan(6);
  await expect(page.locator("[data-bot][data-bot-depth]")).toHaveCount(1);
  await expect.poll(() => page.locator(".mascot-face").evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m41)).toBeGreaterThan(1.5);
  for (const supportingBot of await page.locator('[data-bot]:not([data-bot="grok"])').all()) await expect(supportingBot).toHaveCSS("transform", "none");
  const tilt = await bot.evaluate(element => { const m = new DOMMatrix(getComputedStyle(element).transform); return Math.atan2(m.m12, m.m11) * 180 / Math.PI; });
  expect(tilt).toBeGreaterThan(1); expect(tilt).toBeLessThanOrEqual(4);
  await page.screenshot({ path: info.outputPath("home-bots-pointer-right.png"), fullPage: true });
  const offsets = await page.locator("[data-bot-depth]").evaluateAll(elements => elements.map(element => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform);
    return [matrix.m41, matrix.m42];
  }));
  expect(offsets.flat().every(value => Math.abs(value) <= 12)).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(bot).toHaveCSS("transform", "none");
  await page.mouse.move(30, 30); await settleFrames(page);
  await expect(bot).toHaveCSS("transform", "none");
});

test("reduced motion starts with one static native mascot", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const bots = page.locator("[data-bot]");
  await expect(bots).toHaveCount(1);
  await page.mouse.move(1200, 600); await settleFrames(page);
  for (const bot of await bots.all()) await expect(bot).toHaveCSS("transform", "none");
  await page.screenshot({ path: info.outputPath("home-bots-reduced.png"), fullPage: true });
});

test("touch devices retain a static composition without horizontal overflow", async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage(); await page.goto(`${baseURL}/`);
    await expect(page.locator("[data-bot]")).toHaveCount(1);
    await page.mouse.move(350, 700); await settleFrames(page);
    for (const bot of await page.locator("[data-bot]").all()) await expect(bot).toHaveCSS("transform", "none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("home-bots-touch.png"), fullPage: true });
  } finally { await context.close(); }
});


test("native eyes blink while the body stays unchanged and reduced motion stays open", async ({ page }, info) => {
  await page.clock.install({ time: new Date("2026-10-16T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-16T12:00:01Z"));
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto("/");
  const blink = page.locator('[data-bot="grok"] .bot-blink');
  const portrait = page.locator(".mascot-body");
  await expect(blink).toHaveAttribute("data-blink", "open");
  await page.clock.runFor(1000);
  await page.screenshot({ path: info.outputPath("black-bot-eyes-open.png"), fullPage: true });
  await page.clock.runFor(5100);
  await expect(blink).toHaveAttribute("data-blink", "closed");
  await expect(portrait).toHaveCSS("transform", "none");
  await expect(page.locator(".mascot-eye")).toHaveCount(2);
  // The timer clock and compositor transition clock are independent. Capture
  // the authored closed endpoint after finishing only finite eye transitions.
  await page.locator(".mascot-eye").evaluateAll(eyes => {
    for (const eye of eyes) {
      void getComputedStyle(eye).transform;
      for (const animation of eye.getAnimations()) animation.finish();
    }
  });
  for (const eye of await page.locator(".mascot-eye").all()) {
    expect(await eye.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m22)).toBeCloseTo(0.08, 2);
  }
  await page.screenshot({ path: info.outputPath("black-bot-eyes-closed.png"), fullPage: true });
  await page.clock.runFor(140);
  await expect(blink).toHaveAttribute("data-blink", "open");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.runFor(20000);
  await expect(blink).toHaveAttribute("data-blink", "open");
  for (const eye of await page.locator(".mascot-eye").all()) await expect(eye).toHaveCSS("transform", "none");
});
