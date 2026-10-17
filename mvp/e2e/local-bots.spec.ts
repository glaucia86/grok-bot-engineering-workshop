import { expect, test, type Page } from "@playwright/test";

async function settleFrames(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

const roles = ["grok", "fde", "qa", "devops", "lead"];

test("five original vector mascots remain decorative and leave the working pages clear", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route("**/api/feedback", route => route.fulfill({ json: [] }));
  const raster: string[] = [];
  page.on("request", request => { if (new URL(request.url()).pathname.startsWith("/bots/")) raster.push(request.url()); });
  await page.goto("/");
  const backdrop = page.locator(".bot-backdrop");
  await expect(backdrop).toHaveAttribute("aria-hidden", "true");
  await expect(backdrop).toHaveCSS("pointer-events", "none");
  await expect(backdrop.locator("[data-bot]")).toHaveCount(5);
  for (const role of roles) await expect(page.locator(`[data-bot="${role}"] .mascot-art`)).toBeVisible();
  await expect(backdrop.locator("img, image, canvas, .bot-eye-lid")).toHaveCount(0);
  expect(raster).toEqual([]);
  await page.screenshot({ path: info.outputPath("home-bots-desktop.png"), fullPage: true });
  await page.getByRole("main").getByRole("link", { name: "Leave feedback", exact: true }).click();
  await expect(page.getByLabel("Talk", { exact: true })).toBeVisible();
  await expect(page.locator(".bot-backdrop:visible")).toHaveCount(0);
  await page.goto("/results");
  await expect(page.locator(".bot-backdrop:visible")).toHaveCount(0);
});

test("all five faces track four directions independently of gently tilted bodies and stay inside their shapes", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  for (const [direction, x, y, axis, sign] of [
    ["left", 0, 450, "m41", -1], ["right", 1438, 450, "m41", 1],
    ["up", 900, 0, "m42", -1], ["down", 900, 998, "m42", 1],
  ] as const) {
    for (const role of roles) {
      const face = page.locator(`[data-bot="${role}"] .mascot-face`);
      await expect.poll(async () => {
        await page.mouse.move(x + (x === 0 ? 1 : -1), y);
        await page.mouse.move(x, y);
        return face.evaluate((element, { axis, sign }) => new DOMMatrix(getComputedStyle(element).transform)[axis] * sign, { axis, sign });
      }).toBeGreaterThan(2);
    }
    const checks = await page.locator("[data-bot]").evaluateAll(bots => bots.map(bot => {
      const body = bot.querySelector<SVGPathElement>(".mascot-body")!;
      const inverse = body.getScreenCTM()!.inverse();
      const inside = [...bot.querySelectorAll<SVGEllipseElement>(".mascot-eye")].every(eye => {
        const matrix = eye.getScreenCTM()!;
        return Array.from({ length: 32 }, (_, i) => {
          const angle = i * Math.PI / 16;
          const point = new DOMPoint(eye.cx.baseVal.value + Math.cos(angle) * eye.rx.baseVal.value, eye.cy.baseVal.value + Math.sin(angle) * eye.ry.baseVal.value).matrixTransform(matrix).matrixTransform(inverse);
          return body.isPointInFill(point);
        }).every(Boolean);
      });
      const motion = new DOMMatrix(getComputedStyle(bot.querySelector(".mascot-motion")!).transform);
      return { id: bot.getAttribute("data-bot"), inside, tilt: Math.abs(Math.atan2(motion.m12, motion.m11) * 180 / Math.PI), x: motion.m41, y: motion.m42 };
    }));
    expect(checks.every(check => check.inside)).toBe(true);
    expect(checks.every(check => check.tilt <= 3.01 && Math.abs(check.x) <= 5.41 && Math.abs(check.y) <= 5.41)).toBe(true);
    if (direction === "left" || direction === "right") expect(checks.every(check => check.tilt > 0.5)).toBe(true);
    await page.screenshot({ path: info.outputPath(`five-faces-${direction}.png`), fullPage: true });
  }
  const left = await page.locator('[data-bot="fde"]').boundingBox();
  const right = await page.locator('[data-bot="qa"]').boundingBox();
  await page.mouse.move((left!.x + left!.width / 2 + right!.x + right!.width / 2) / 2, left!.y);
  await expect.poll(() => page.locator('[data-bot="fde"] .mascot-face').evaluate(e => new DOMMatrix(getComputedStyle(e).transform).m41)).toBeGreaterThan(1);
  await expect.poll(() => page.locator('[data-bot="qa"] .mascot-face').evaluate(e => new DOMMatrix(getComputedStyle(e).transform).m41)).toBeLessThan(-1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const element of await page.locator("[data-bot-depth]").all()) await expect(element).toHaveCSS("transform", "none");
});

test("reduced motion keeps the entire team static and open", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("[data-bot]")).toHaveCount(5);
  await page.mouse.move(1200, 600); await settleFrames(page);
  for (const element of await page.locator("[data-bot-depth], .mascot-eye").all()) await expect(element).toHaveCSS("transform", "none");
  await expect(page.locator('.bot-blink[data-blink="open"]')).toHaveCount(5);
  await page.screenshot({ path: info.outputPath("home-bots-reduced.png"), fullPage: true });
});

test("touch devices retain five static vectors without horizontal overflow", async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage(); await page.goto(`${baseURL}/`);
    await expect(page.locator("[data-bot]")).toHaveCount(5);
    await page.mouse.move(350, 700); await settleFrames(page);
    for (const element of await page.locator("[data-bot-depth], .mascot-eye").all()) await expect(element).toHaveCSS("transform", "none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('.bot-blink[data-blink="open"]')).toHaveCount(5);
    await page.screenshot({ path: info.outputPath("home-bots-touch.png"), fullPage: true });
  } finally { await context.close(); }
});

test("each pair of native eyes closes separately while the other faces stay open", async ({ page }, info) => {
  await page.clock.install({ time: new Date("2026-10-16T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-16T12:00:01Z"));
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto("/");
  await expect(page.locator('.bot-blink[data-blink="open"]')).toHaveCount(5);
  await page.clock.runFor(1000);
  await page.screenshot({ path: info.outputPath("five-eyes-open.png"), fullPage: true });
  await page.clock.runFor(5100);
  for (const role of roles) {
    const bot = page.locator(`[data-bot="${role}"]`);
    await expect(bot.locator(".bot-blink")).toHaveAttribute("data-blink", "closed");
    await expect(page.locator('.bot-blink[data-blink="closed"]')).toHaveCount(1);
    await expect(bot.locator(".mascot-body")).toHaveCSS("transform", "none");
    await bot.locator(".mascot-eye").evaluateAll(eyes => {
      for (const eye of eyes) {
        void getComputedStyle(eye).transform;
        for (const animation of eye.getAnimations()) animation.finish();
      }
    });
    for (const eye of await bot.locator(".mascot-eye").all()) expect(await eye.evaluate(e => new DOMMatrix(getComputedStyle(e).transform).m22)).toBeCloseTo(.08, 2);
    await page.screenshot({ path: info.outputPath(`${role}-eyes-closed.png`), fullPage: true });
    await page.clock.runFor(600);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.runFor(20000);
  await expect(page.locator('.bot-blink[data-blink="open"]')).toHaveCount(5);
});
