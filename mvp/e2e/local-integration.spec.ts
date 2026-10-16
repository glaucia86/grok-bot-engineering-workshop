import { expect, test, type Page } from "@playwright/test";

// Integration-only, intercepted loopback fixtures. No remote API or database access.
async function submit(page: Page, talk = "Combined lifecycle fixture") {
  await page.getByLabel("Talk", { exact: true }).fill(talk);
  await page.getByLabel("Your name", { exact: true }).fill("Integration attendee");
  await page.getByRole("radio", { name: "4 stars", exact: true }).check();
  await page.locator("#feedback").getByRole("button", { name: "Send feedback", exact: true }).click();
}

for (const width of [390, 1440]) {
  test(`combined fixture: saves supersede initial and refresh requests at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.emulateMedia({ reducedMotion: width === 390 ? "reduce" : "no-preference" });
    let gets = 0;
    let posts = 0;
    const held: { release: () => void; done: Promise<void> }[] = [];
    const longName = "Engineering reliable bots: a practical workshop with examples";
    const rows = [
      { talkId: longName, average: 4, count: 2 },
      { talkId: "Unbroken".repeat(12), average: 3, count: 1 },
      { talkId: "Testing the full workshop", average: 4.3, count: 4 },
    ];
    await page.route("**/api/feedback", async route => {
      if (route.request().method() === "POST") {
        posts++;
        return route.fulfill({ status: 201, json: { id: posts, ...route.request().postDataJSON(), createdAt: "2026-01-01T00:00:00.000Z" } });
      }
      gets++;
      if (gets <= 2) {
        let release!: () => void;
        let finished!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const done = new Promise<void>(resolve => { finished = resolve; });
        held.push({ release, done });
        await gate;
        try {
          await route.fulfill({ json: [{ talkId: "OBSOLETE response", average: 1, count: 99 }] });
        } finally { finished(); }
        return;
      }
      return route.fulfill({ json: rows });
    });
    await page.goto("/");
    await expect(page.locator("#results").getByRole("status")).toHaveText("Loading feedback.");
    await expect.poll(() => held.length).toBe(1);
    await submit(page);
    await expect.poll(() => held.length).toBe(2);
    await expect(page.locator("#feedback").getByText(/Feedback saved/)).toBeVisible();
    // A second valid save is allowed while the first results refresh is still pending.
    await submit(page);
    await expect.poll(() => gets).toBe(3);
    await expect(page.locator("#results").getByRole("rowheader", { name: longName, exact: true })).toBeVisible();
    await expect(page.locator(".dashboard-count").first()).toHaveText("2");
    // Deliver the obsolete refresh and initial request after the latest data.
    held[1].release(); await held[1].done;
    held[0].release(); await held[0].done;
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(page.getByText("OBSOLETE response", { exact: true })).toHaveCount(0);
    await expect(page.locator(".dashboard-count").first()).toHaveText("2");
    await expect(page.locator("#results").getByRole("status")).toHaveCount(0);
    await expect(page.locator("#results").getByRole("alert")).toHaveCount(0);
    expect(posts).toBe(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390) expect(await page.locator(".dashboard-bar-fill").first().evaluate(node => node.getAnimations().length)).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: info.outputPath(`combined-${width}-full-local-fixture.png`), fullPage: true });
    const top = await page.screenshot({ path: info.outputPath(`combined-${width}-viewport-local-fixture.jpg`), type: "jpeg", quality: 55 });
    console.log(`INTEGRATION_IMAGE combined-${width}-viewport ${top.toString("base64")}`);
    if (width === 390) {
      await page.locator("#results").scrollIntoViewIfNeeded();
      const results = await page.screenshot({ path: info.outputPath("combined-390-results-local-fixture.jpg"), type: "jpeg", quality: 55 });
      console.log(`INTEGRATION_IMAGE combined-390-results ${results.toString("base64")}`);
    }
  });
}

test("combined fixture: form and stale-results retries remain independent", async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let gets = 0; let posts = 0; let failResults = false; let failPost = false;
  await page.route("**/api/feedback", route => {
    if (route.request().method() === "GET") {
      gets++;
      return failResults ? route.fulfill({ status: 503, body: "Unavailable" })
        : route.fulfill({ json: [{ talkId: "Previously saved talk", average: 4, count: posts + 1 }] });
    }
    posts++;
    return failPost ? route.fulfill({ status: 503, body: "Unavailable" })
      : route.fulfill({ status: 201, json: { id: posts, ...route.request().postDataJSON(), createdAt: "2026-01-01T00:00:00.000Z" } });
  });
  await page.goto("/");
  const results = page.locator("#results");
  const form = page.locator("#feedback");
  await expect(results.getByRole("rowheader", { name: "Previously saved talk" })).toBeVisible();
  failResults = true;
  await submit(page);
  await expect(form.getByText(/Feedback saved/)).toBeVisible();
  await expect(results.getByRole("alert")).toContainText("Feedback saved. Results could not refresh.");
  await expect(results.getByText(/Previously loaded results/)).toBeVisible();
  await expect(results.locator(".dashboard-count")).toHaveText("1");
  failPost = true;
  await submit(page, "Retain this second submission");
  await expect(form.getByRole("alert")).toContainText("Your entries are still here");
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toHaveCount(2);
  const beforeRetry = gets;
  failResults = false;
  await results.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(results.getByRole("alert")).toHaveCount(0);
  await expect(results.getByText(/Previously loaded results/)).toHaveCount(0);
  expect(posts).toBe(2);
  expect(gets).toBe(beforeRetry + 1);
  await expect(page.getByLabel("Talk", { exact: true })).toHaveValue("Retain this second submission");
  await expect(page.getByRole("radio", { name: "4 stars", exact: true })).toBeChecked();
  failPost = false;
  await form.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(form.getByRole("alert")).toHaveCount(0);
  await expect(form.getByText(/Feedback saved/)).toBeVisible();
  await expect(results.locator(".dashboard-count")).toHaveText("4");
  expect(posts).toBe(3);
  expect(gets).toBe(beforeRetry + 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("combined-independent-retries-320-local-fixture.png"), fullPage: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  const narrow = await page.screenshot({ path: info.outputPath("combined-320-viewport-local-fixture.jpg"), type: "jpeg", quality: 65 });
  console.log(`INTEGRATION_IMAGE combined-320-viewport ${narrow.toString("base64")}`);
});
