import { expect, test, type Page } from "@playwright/test";

// Route contracts use intercepted loopback fixtures only. No preview or DB writes.
const routes = [
  { path: "/", active: "Home" },
  { path: "/feedback", active: "Leave feedback" },
  { path: "/results", active: "Results" },
] as const;

async function expectNavigation(page: Page, active: string) {
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  for (const route of routes) {
    const link = nav.getByRole("link", { name: route.active, exact: true });
    await expect(link).toHaveAttribute("href", route.path);
    if (route.active === active) await expect(link).toHaveAttribute("aria-current", "page");
    else await expect(link).not.toHaveAttribute("aria-current", "page");
  }
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
}

test("local route contract: home presents the workshop without form, dashboard or API reads", async ({ page }) => {
  let reads = 0;
  await page.route("**/api/feedback", route => { reads++; return route.fulfill({ json: [] }); });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expectNavigation(page, "Home");
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("form")).toHaveCount(0);
  await expect(page.getByLabel("Talk", { exact: true })).toHaveCount(0);
  await expect(page.locator("#results")).toHaveCount(0);
  await expect(page.getByRole("table")).toHaveCount(0);
  expect(reads).toBe(0);
});

for (const route of routes) {
  test(`local route contract: ${route.path} supports direct entry, reload, active navigation and skip focus`, async ({ page }) => {
    await page.route("**/api/feedback", handler => handler.fulfill({ json: [] }));
    await page.goto(route.path);
    for (const reload of [false, true]) {
      if (reload) await page.reload();
      await expectNavigation(page, route.active);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.locator("main#main-content")).toBeVisible();
      if (route.path === "/feedback") {
        await expect(page.getByLabel("Talk", { exact: true })).toBeVisible();
        await expect(page.locator("#results")).toHaveCount(0);
      } else if (route.path === "/results") {
        await expect(page.getByRole("heading", { name: "No feedback yet" })).toBeVisible();
        await expect(page.getByLabel("Talk", { exact: true })).toHaveCount(0);
        await expect(page.locator("#results").getByRole("link", { name: /Leave feedback/i })).toHaveAttribute("href", "/feedback");
      }
      await page.keyboard.press("Tab");
      const skip = page.getByRole("link", { name: /Skip to (main )?content/i });
      await expect(skip).toBeFocused();
      await expect(skip).toHaveAttribute("href", "#main-content");
      await page.keyboard.press("Enter");
      await expect(page.locator("#main-content")).toBeFocused();
    }
  });
}

test("local route contract: keyboard navigation and browser history follow the three destinations", async ({ page }) => {
  await page.route("**/api/feedback", route => route.fulfill({ json: [] }));
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await nav.getByRole("link", { name: "Leave feedback", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/feedback$/);
  await expectNavigation(page, "Leave feedback");
  await nav.getByRole("link", { name: "Results", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/results$/);
  await expectNavigation(page, "Results");
  await page.goBack();
  await expect(page).toHaveURL(/\/feedback$/);
  await expectNavigation(page, "Leave feedback");
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expectNavigation(page, "Home");
  await page.goForward();
  await expect(page).toHaveURL(/\/feedback$/);
  await expectNavigation(page, "Leave feedback");
});
