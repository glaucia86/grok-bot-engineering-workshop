import { expect, test } from "@playwright/test";

// The approved design uses the same horizontal header on all three routes.
test("all routes share the horizontal header and reflow without the retired sidebar", async ({ page }, info) => {
  await page.route("**/api/feedback", route => route.fulfill({ json: [] }));
  await page.route("**/api/feedback/insights?*", route => route.fulfill({ status: 503 }));
  for (const [width, height] of [[1440, 1000], [390, 844], [320, 800]]) {
    await page.setViewportSize({ width, height });
    for (const path of ["/", "/feedback", "/results"]) {
      await page.goto(path);
      await expect(page.locator("body")).not.toContainText("Loop Engineering");
      await expect(page.locator('[aria-label*="Loop Engineering"]')).toHaveCount(0);
      await expect(page.locator(".loop-sidebar, .company-header, .loop-topbar")).toHaveCount(0);
      const header = page.locator(".tf-header");
      await expect(header).toBeVisible();
      const nav = header.getByRole("navigation", { name: "Main navigation" });
      for (const link of await nav.getByRole("link").all()) await expect(link).toBeInViewport();
      await expect(header.getByRole("group", { name: "Language" })).toBeVisible();
      if (path === "/") {
        await expect(page.locator(".tf-hero")).toBeVisible();
        await expect(page.locator(".tf-rating-card")).toBeVisible();
        await expect(page.locator(".tf-insight-art")).toHaveAttribute("aria-hidden", "true");
      } else {
        await expect(page.locator(".tf-main-inner")).toBeVisible();
        await expect(page.locator(".tf-hero")).toHaveCount(0);
      }
      if (width === 1440) expect((await header.boundingBox())!.height).toBeLessThanOrEqual(100);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: info.outputPath(`${path.slice(1) || "home"}-${width}.png`), fullPage: true });
    }
  }
});

test("the new hero keeps text steady across pointer and motion preference changes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/api/feedback", route => route.fulfill({ json: [] }));
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const heading = page.getByRole("heading", { level: 1 });
  const original = await heading.boundingBox();
  await page.mouse.move(0, 400); await page.mouse.move(1439, 400);
  expect(await heading.boundingBox()).toEqual(original);
  await expect(page.locator(".tf-hero-copy")).toHaveCSS("transform", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".tf-hero-copy .tf-button").first().hover();
  await expect(page.locator(".tf-hero-copy .tf-button").first()).toHaveCSS("transform", "none");
  expect(await page.locator(".tf-hero").evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0);
});

test("native FAQ disclosure and page content remain usable after scrolling and motion changes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/api/feedback", route => route.fulfill({ json: [] }));
  await page.goto("/");
  const first = page.locator(".tf-faq details").first();
  await expect(page.locator(".tf-faq details")).toHaveCount(4);
  await first.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("open", "");
  await expect(first.locator("p")).toHaveText("No. Your name is required to submit feedback, but results show ratings and comments without names.");
  await expect(page.locator(".tf-header")).toBeInViewport();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  await page.keyboard.press("Enter");
  await expect(first).not.toHaveAttribute("open");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await first.locator("summary").focus(); await page.keyboard.press("Space");
  await expect(first).toHaveAttribute("open", "");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("touch browsing keeps the shared header reachable and the hero navigation functional", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.route("**/api/feedback", route => route.fulfill({ json: [] }));
    await page.goto(`${baseURL}/`);
    await page.evaluate(() => window.scrollTo(0, 250));
    await expect(page.locator(".tf-header")).toBeInViewport();
    await expect(page.locator(".tf-hero-copy")).toHaveCSS("transform", "none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator(".tf-hero-copy").getByRole("link", { name: "Rate a talk", exact: true }).tap();
    await expect(page).toHaveURL(/\/feedback$/);
    await expect(page.getByLabel("Talk", { exact: true })).toBeVisible();
  } finally { await context.close(); }
});
