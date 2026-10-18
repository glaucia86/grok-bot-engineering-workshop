import { expect, test, type Page } from "@playwright/test";

// The approved hero replaces the retired decorative mascots. Keep coverage of
// pointer stability, native controls, touch, reduced motion and timer behavior.
async function settleFrames(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/feedback", route => route.fulfill({ json: [] }));
  await page.route("**/api/feedback/insights?*", route => route.fulfill({ status: 503 }));
});

test("the new rating hero leaves retired mascots out and keeps working routes clear", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const raster: string[] = [];
  page.on("request", request => { if (new URL(request.url()).pathname.startsWith("/bots/")) raster.push(request.url()); });
  await page.goto("/");
  await expect(page.locator(".bot-backdrop, [data-bot]")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The stage speaks.The audience responds.");
  const card = page.locator(".tf-rating-card");
  await expect(card.getByRole("group", { name: "Choose a rating" })).toBeVisible();
  await expect(card.getByRole("radio")).toHaveCount(5);
  await expect(page.locator(".tf-steps > li")).toHaveCount(3);
  await expect(page.locator(".tf-insight-art")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator(".tf-insight-art")).toContainText("Illustration of the rating scale");
  expect(raster).toEqual([]);
  await page.screenshot({ path: info.outputPath("home-rating-hero-desktop.png"), fullPage: true });
  await page.getByRole("main").getByRole("link", { name: "Leave feedback", exact: true }).click();
  await expect(page.getByLabel("Talk", { exact: true })).toBeVisible();
  await expect(page.locator(".tf-rating-card, .bot-backdrop")).toHaveCount(0);
  await page.goto("/results");
  await expect(page.locator(".tf-rating-card, .bot-backdrop")).toHaveCount(0);
});

test("pointer movement keeps the hero steady and hovering stars never commits a rating", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const heading = page.getByRole("heading", { level: 1 });
  const original = await heading.boundingBox();
  const group = page.getByRole("group", { name: "Choose a rating" });
  for (const [x, y] of [[0, 450], [1438, 450], [900, 0], [900, 998]]) {
    await page.mouse.move(x, y); await settleFrames(page);
    expect(await heading.boundingBox()).toEqual(original);
  }
  for (const radio of await group.getByRole("radio").all()) {
    await radio.hover();
    await expect(group.getByRole("radio", { checked: true })).toHaveCount(0);
  }
  await expect(page.getByText("Tap a star to get started", { exact: true })).toBeVisible();
  await group.getByRole("radio", { name: "2 stars", exact: true }).check();
  await group.getByRole("radio", { name: "5 stars", exact: true }).hover();
  await expect(group.getByRole("radio", { name: "2 stars", exact: true })).toBeChecked();
  await expect(page.getByRole("link", { name: "Continue with my rating" })).toHaveAttribute("href", "/feedback?rating=2");
  await page.screenshot({ path: info.outputPath("hero-pointer-keeps-selected-rating.png"), fullPage: true });
});

test("reduced motion keeps the hero static while native rating keyboard controls work", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const group = page.getByRole("group", { name: "Choose a rating" });
  const first = group.getByRole("radio", { name: "1 star", exact: true });
  await first.focus(); await page.keyboard.press("Space"); await page.keyboard.press("ArrowLeft");
  await expect(group.getByRole("radio", { name: "5 stars", exact: true })).toBeChecked();
  await expect(page.getByText("5 of 5 stars selected", { exact: true })).toBeVisible();
  await page.mouse.move(1200, 600); await settleFrames(page);
  expect(await page.locator(".tf-hero").evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0);
  await expect(page.locator(".tf-hero .tf-button").first()).toHaveCSS("transition-duration", "0s");
  await page.screenshot({ path: info.outputPath("home-rating-hero-reduced.png"), fullPage: true });
});

test("touch devices can choose and carry a rating without horizontal overflow", async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.route("**/api/feedback", route => route.fulfill({ json: [] }));
    await page.goto(`${baseURL}/`);
    const group = page.getByRole("group", { name: "Choose a rating" });
    await expect(group.getByRole("radio")).toHaveCount(5);
    const fourth = group.getByRole("radio", { name: "4 stars", exact: true });
    await fourth.tap();
    await expect(fourth).toBeChecked();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("home-rating-hero-touch.png"), fullPage: true });
    await page.getByRole("link", { name: "Continue with my rating" }).tap();
    await expect(page).toHaveURL(/\/feedback\?rating=4$/);
    await expect(page.getByRole("radio", { name: "4 stars", exact: true })).toBeChecked();
    await expect(page.getByLabel("Your name", { exact: true })).toHaveAttribute("required", "");
  } finally { await context.close(); }
});

test("the static hero never changes the selected rating or polls as time passes", async ({ page }) => {
  let reads = 0;
  await page.route("**/api/feedback", route => { reads++; return route.fulfill({ json: [] }); });
  await page.clock.install({ time: new Date("2026-10-16T12:00:00Z") });
  await page.goto("/");
  await expect(page.locator(".tf-summary strong")).toHaveText(["0", "0"]);
  const group = page.getByRole("group", { name: "Choose a rating" });
  await group.getByRole("radio", { name: "3 stars", exact: true }).check();
  await page.clock.fastForward(30_000);
  await expect(group.getByRole("radio", { name: "3 stars", exact: true })).toBeChecked();
  await expect(page.getByText("3 of 5 stars selected", { exact: true })).toBeVisible();
  await expect(page.locator("[data-bot], .bot-blink")).toHaveCount(0);
  expect(reads).toBe(1);
});
