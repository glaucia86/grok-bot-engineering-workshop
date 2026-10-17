import { expect, test } from "@playwright/test";

test("the product shell has a 232px desktop sidebar and a visible compact mobile navigation", async ({ page }, info) => {
  await page.route("**/api/feedback", route => route.fulfill({ json: [] }));
  await page.route("**/api/feedback/insights?*", route => route.fulfill({ status: 503 }));
  for (const [width, height] of [[1440, 1000], [390, 844], [320, 800]]) {
    await page.setViewportSize({ width, height });
    for (const path of ["/", "/feedback", "/results"]) {
      await page.goto(path);
      const nav = page.getByRole("navigation", { name: "Main navigation" });
      const sidebar = page.locator(".loop-sidebar");
      await expect(sidebar).toBeVisible();
      if (width === 1440) expect((await sidebar.boundingBox())!.width).toBe(232);
      for (const link of await nav.getByRole("link").all()) await expect(link).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: info.outputPath(`${path.slice(1) || "home"}-${width}.png`), fullPage: true });
    }
  }
});
