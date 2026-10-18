import { expect, test } from "@playwright/test";

// Intercepted local UI evidence only. These tests never access shared Neon data.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/feedback**", route => route.fulfill({ status: 503, body: "Outside this local form fixture" }));
});

for (const width of [320, 390, 1440]) {
  test(`focused feedback form and guidance remain usable at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/feedback");
    const form = page.getByRole("form", { name: "How was the talk?" });
    const guidance = page.getByRole("complementary", { name: "Make your feedback count" });
    await expect(form).toBeVisible();
    await expect(guidance).toBeVisible();
    await expect(guidance.getByRole("listitem")).toHaveCount(3);
    await expect(page.getByLabel("Your name", { exact: true })).toHaveAttribute("autocomplete", "name");
    await expect(page.locator('.rating-selection[aria-live="polite"]')).toHaveCount(1);
    await expect(page.locator(".feedback-panel")).toHaveCSS("border-radius", width <= 520 ? "25px" : "30px");
    await expect(page.getByRole("button", { name: "Send feedback", exact: true })).toHaveCSS("background-color", "rgb(91, 61, 245)");
    const formBounds = await form.boundingBox();
    for (const radio of await page.getByRole("radio").all()) {
      const bounds = await radio.boundingBox();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(formBounds!.x + formBounds!.width + .5);
    }
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`feedback-redesign-${width}.png`), fullPage: true });
  });
}

test("redesigned form preserves native rating keys, validation, retry and confirmed success", async ({ page }, info) => {
  let attempts = 0;
  const submitted: unknown[] = [];
  await page.route("**/api/feedback", async route => {
    attempts++;
    submitted.push(route.request().postDataJSON());
    if (attempts === 1) return route.fulfill({ status: 503, body: "Local fixture unavailable" });
    return route.fulfill({ status: 201, json: { id: 901, ...route.request().postDataJSON(), createdAt: "2026-10-17T12:00:00.000Z" } });
  });
  await page.goto("/feedback");
  const form = page.getByRole("form", { name: "How was the talk?" });
  await form.getByRole("button", { name: "Send feedback" }).click();
  await expect(page.getByLabel("Talk", { exact: true })).toBeFocused();
  expect(attempts).toBe(0);
  await page.getByLabel("Talk", { exact: true }).fill("  Local design fixture  ");
  await page.getByLabel("Your name", { exact: true }).fill("  Fixture attendee  ");
  await page.getByRole("radio", { name: "1 star", exact: true }).focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("radio", { name: "5 stars", exact: true })).toBeChecked();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByText("4 of 5 stars selected", { exact: true })).toBeVisible();
  await form.getByRole("button", { name: "Send feedback" }).click();
  await expect(form.getByRole("alert")).toContainText("Your entries are still here");
  await expect(page.getByLabel("Talk", { exact: true })).toHaveValue("  Local design fixture  ");
  await expect(page.getByRole("radio", { name: "4 stars", exact: true })).toBeChecked();
  await page.screenshot({ path: info.outputPath("feedback-redesign-retry.png"), fullPage: true });
  await form.getByRole("button", { name: "Try again" }).click();
  await expect(form.getByText("Feedback saved. Thank you for helping the next talk.")).toBeVisible();
  await expect(form.getByRole("link", { name: "View results" })).toHaveAttribute("href", "/results");
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("");
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  expect(submitted).toEqual(Array.from({ length: 2 }, () => ({ talkId: "Local design fixture", author: "Fixture attendee", rating: 4, comment: "" })));
  await page.screenshot({ path: info.outputPath("feedback-redesign-saved.png"), fullPage: true });
});

test("form control boundaries have at least 3 to 1 contrast against their surrounding surface", async ({ page }) => {
  await page.goto("/feedback");
  const contrasts = await page.locator('.form-field input, .form-field textarea, .rating-option > span').evaluateAll(controls => {
    const luminance = (color: string) => {
      const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => {
        const channel = value / 255;
        return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
      });
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    const panel = getComputedStyle(document.querySelector(".feedback-panel")!).backgroundColor;
    return controls.map(control => {
      const style = getComputedStyle(control);
      const border = luminance(style.borderTopColor);
      const surroundings = luminance(panel);
      return { control: control.getAttribute("name") ?? "rating star", ratio: (Math.max(border, surroundings) + .05) / (Math.min(border, surroundings) + .05) };
    });
  });
  expect(contrasts).toHaveLength(8);
  for (const { control, ratio } of contrasts) expect(ratio, `${control} boundary contrast`).toBeGreaterThanOrEqual(3);
});
