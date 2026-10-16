import { expect, test } from "@playwright/test";
for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`local shell fixture: compact task, anchors, reflow and ${reducedMotion} motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.route("**/api/feedback", route => route.fulfill({ json: [] }));
    for (const [width,height] of [[320,800],[390,844],[768,1024],[1440,900]]) {
      await page.setViewportSize({width,height}); await page.goto("/");
      const talk = page.getByLabel("Talk", { exact:true });
      await expect(talk).toBeVisible();
      expect((await talk.boundingBox())!.y).toBeLessThan(width === 320 ? 500 : 400);
      const nav = page.getByRole("navigation", {name:"Main navigation"});
      await expect(nav.getByRole("link", { name:"Leave feedback" })).toBeVisible();
      await expect(nav.getByRole("link", { name:/See results/ })).toBeVisible();
      await expect(page.getByRole("heading", {level:1})).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 1440) {
        await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
        await expect(talk).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.evaluate(() => { document.documentElement.style.zoom = "1"; });
      }
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", {name:"Skip to feedback"})).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("#feedback")).toBeInViewport();
      await expect(nav.getByRole("link").first()).toHaveCSS("transition-duration", reducedMotion === "reduce" ? "0s" : "0.16s");
      await nav.getByRole("link", { name:/See results/ }).focus(); await page.keyboard.press("Enter");
      await expect(page.locator("#results")).toBeInViewport();
      await nav.getByRole("link", { name:"Leave feedback" }).focus(); await page.keyboard.press("Enter");
      await expect(page.locator("#feedback")).toBeInViewport();
    }
  });
}
