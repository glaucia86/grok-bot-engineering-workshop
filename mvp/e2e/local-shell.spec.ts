import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`local shell fixture: shared navigation, three-route reflow and ${reducedMotion} motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.route("**/api/feedback", route => route.fulfill({ json: [] }));
    for (const [width, height] of [[320, 800], [390, 844], [768, 1024], [1440, 900]]) {
      await page.setViewportSize({ width, height });
      for (const path of ["/", "/feedback", "/results"]) {
        await page.goto(path);
        const nav = page.getByRole("navigation", { name: "Main navigation" });
        for (const name of ["Home", "Leave feedback", "Results"]) {
          await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
        }
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
        await expect(page.locator("main#main-content")).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (width === 1440) {
          await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          await page.evaluate(() => { document.documentElement.style.zoom = "1"; });
        }
        await expect(nav.getByRole("link").first()).toHaveCSS("transition-duration", reducedMotion === "reduce" ? "0s" : "0.16s");
      }
    }
  });
}
