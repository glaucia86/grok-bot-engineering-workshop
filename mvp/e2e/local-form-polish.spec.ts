import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

for (const hasRating of [true, false]) {
  test(`local form fixture: Enter from another field clears pointer preview (rating committed: ${hasRating})`, async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    let submitted: { rating: number } | undefined;
    let finish: (() => void) | undefined;
    await page.route("**/api/feedback", async (route) => {
      if (route.request().method() === "GET") return route.fulfill({ json: [] });
      submitted = route.request().postDataJSON();
      await new Promise<void>((resolve) => { finish = resolve; });
      await route.fulfill({ status: 503, body: "Local fixture unavailable" });
    });
    await page.goto("/feedback");
    await page.getByLabel("Talk", { exact: true }).fill("Keyboard preview fixture");
    const author = page.getByLabel("Your name", { exact: true });
    await author.fill("Fixture attendee");
    if (hasRating) await page.getByRole("radio", { name: "2 stars", exact: true }).check();
    await page.getByRole("radio", { name: "5 stars", exact: true }).hover();
    await expect(page.getByText("Preview: 5 of 5 stars", { exact: true })).toBeVisible();
    // DOM focus preserves the pointer over star five, unlike clicking the field.
    await author.evaluate((input) => input.focus({ preventScroll: true }));
    await expect(author).toBeFocused();
    await expect(page.getByText("Preview: 5 of 5 stars", { exact: true })).toBeVisible();
    await page.keyboard.press("Enter");
    if (hasRating) {
      await expect(page.getByRole("button", { name: /Saving/ })).toBeDisabled();
      await expect.poll(() => submitted?.rating).toBe(2);
    } else {
      await expect(page.getByText("rating must be a number", { exact: true })).toBeVisible();
      await expect(page.getByRole("radio", { name: "1 star", exact: true })).toBeFocused();
      expect(submitted).toBeUndefined();
    }
    await expect(page.getByText("Preview: 5 of 5 stars", { exact: true })).toHaveCount(0);
    await expect(page.locator('.rating-option svg[fill="currentColor"]')).toHaveCount(hasRating ? 2 : 0);
    await expect(page.getByText(hasRating ? "2 of 5 stars selected" : "No rating selected", { exact: true })).toBeVisible();
    await page.locator("#feedback").screenshot({ path: info.outputPath(`keyboard-submit-${hasRating ? "saving" : "invalid"}-local-fixture.png`) });
    finish?.();
  });
}

// Local intercepted API fixtures: visual and interaction evidence, NOT persistence.
for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`local form fixture: pointer, keyboard, recovery and saved states (${reducedMotion})`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion });
    let posts = 0;
    let finish: (() => void) | undefined;
    await page.route("**/api/feedback", async (route) => {
      if (route.request().method() === "GET") return route.fulfill({ json: [] });
      posts++;
      await new Promise<void>((resolve) => { finish = resolve; });
      if (posts === 1) return route.fulfill({ status: 503, body: "Unavailable" });
      await route.fulfill({ status: 201, json: { id: 1, ...route.request().postDataJSON(), createdAt: "2026-01-01T00:00:00.000Z" } });
    });
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/feedback");
      const form = page.locator("#feedback");
      const capture = async (state: string) => {
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await form.screenshot({ path: info.outputPath(`${viewport.width}-${state}-local-fixture.png`) });
      };
      await capture("untouched");
      await page.getByLabel("Talk", { exact: true }).focus(); await capture("focused");
      await page.getByRole("button", { name: "Send feedback", exact: true }).click();
      await expect(page.getByLabel("Talk", { exact: true })).toBeFocused(); await capture("validation");
      await page.getByLabel("Talk", { exact: true }).fill("Local fixture talk");
      await page.getByLabel("Your name", { exact: true }).fill("Fixture attendee");
      await page.getByLabel("Comment (optional)").fill("Retain this comment");
      const second = page.getByRole("radio", { name: "2 stars", exact: true });
      await second.check();
      await page.getByRole("radio", { name: "5 stars", exact: true }).hover();
      await expect(page.getByText("Preview: 5 of 5 stars")).toBeVisible();
      await expect(second).toBeChecked();
      await page.getByLabel("Talk", { exact: true }).hover();
      await expect(page.getByText("Preview: 5 of 5 stars")).toHaveCount(0);
      await second.focus(); await page.keyboard.press("ArrowRight");
      await expect(page.getByText("3 of 5 stars selected")).toBeVisible();
      await page.keyboard.press("Space"); await capture("selected");
      for (const radio of await page.getByRole("radio").all()) {
        const box = await radio.boundingBox(); expect(box!.width).toBeGreaterThanOrEqual(44); expect(box!.height).toBeGreaterThanOrEqual(44);
      }
      posts = 0;
      const submit = page.getByRole("button", { name: "Send feedback", exact: true });
      const before = await submit.boundingBox(); await submit.click();
      const saving = page.getByRole("button", { name: /Saving/ });
      await expect(saving).toBeDisabled();
      const during = await saving.boundingBox(); expect(during!.width).toBe(before!.width); expect(during!.height).toBe(before!.height);
      await expect.poll(() => posts).toBe(1); await capture("saving");
      await page.locator("#feedback form").evaluate((form) => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
      expect(posts).toBe(1); finish!();
      await expect(form.getByRole("alert")).toBeVisible();
      await expect(page.getByLabel("Comment (optional)")).toHaveValue("Retain this comment");
      await expect(page.getByRole("radio", { name: "3 stars", exact: true })).toBeChecked(); await capture("failure");
      await page.getByRole("button", { name: "Try again", exact: true }).click();
      await expect.poll(() => posts).toBe(2); finish!();
      await expect(form.getByRole("link", { name: "View results" })).toHaveAttribute("href", "/results");
      await capture("saved");
      await page.getByLabel("Talk", { exact: true }).fill("Another talk");
      await expect(form.getByText(/Feedback saved/)).toBeVisible();
    }
    await page.setViewportSize({ width: 320, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator("body").evaluate((body) => { body.style.zoom = "2"; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (reducedMotion === "reduce") {
      await page.getByRole("radio", { name: "1 star", exact: true }).hover();
      expect(await page.locator(".rating-option span").first().evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0s");
      expect(await page.locator(".rating-option span").first().evaluate((el) => getComputedStyle(el).transform)).toBe("none");
    }
  });
}

test("local form fixture: 320px stars fit the form content without losing44px targets", async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.route("**/api/feedback", route => route.fulfill({ json: [] }));
  await page.goto("/feedback");
  const group = page.locator(".rating-options");
  const bounds = await page.locator("#feedback form").boundingBox();
  const ratingBounds = await group.boundingBox();
  const targets = await page.getByRole("radio").all();
  const boxes = await Promise.all(targets.map(target => target.boundingBox()));
  await writeFile(info.outputPath("320px-rating-geometry.json"), JSON.stringify({ bounds, ratingBounds, boxes }, null, 2));
  await info.attach("320px-rating-geometry.json", { path: info.outputPath("320px-rating-geometry.json"), contentType: "application/json" });
  await page.locator("#feedback").screenshot({ path: info.outputPath("320px-rating-content-local-fixture.png") });
  for (const box of boxes) {
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x).toBeGreaterThanOrEqual(bounds!.x - .5);
    expect(box!.x + box!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width + .5);
  }
});
