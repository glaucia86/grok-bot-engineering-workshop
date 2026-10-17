import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Portable helper. Requires an already-built, running app and its existing
// Playwright dependency. Every API response is intercepted; no persistence.
// node capture-baseline-form.mjs <mvp-directory> <loopback-url> <output-directory>
const [appArgument, originArgument, outputArgument] = process.argv.slice(2);
if (!appArgument || !originArgument || !outputArgument) {
  throw new Error("Usage: node capture-baseline-form.mjs <mvp-directory> <loopback-url> <output-directory>");
}
const app = path.resolve(appArgument);
const output = path.resolve(outputArgument);
const origin = new URL(originArgument);
if (!["127.0.0.1", "localhost"].includes(origin.hostname)) throw new Error("Only a local fixture target is supported");
const require = createRequire(path.join(app, "package.json"));
const { chromium, expect } = require("@playwright/test");
const git = (...args) => execFileSync("git", ["-C", app, ...args], { encoding: "utf8" }).trim();
const commit = git("rev-parse", "HEAD");
const source = await readFile(path.join(app, "src/components/feedback-form.tsx"));
const referenceSource = execFileSync("git", ["-C", app, "show", "c69fa31:mvp/src/components/feedback-form.tsx"]);
const normalizedHash = (bytes) => createHash("sha256").update(bytes.toString().replaceAll("\r\n", "\n")).digest("hex");
await mkdir(output, { recursive: true });
const metadata = {
  scope: "Baseline form on shared shell #35; local intercepted API fixtures, not persistence or preview acceptance",
  commit, buildId: (await readFile(path.join(app, ".next/BUILD_ID"), "utf8")).trim(),
  origin: origin.origin, browser: "Chromium", capturedAt: new Date().toISOString(),
  formSourceSha256: normalizedHash(source),
  formSourceMatchesMainC69fa31: normalizedHash(source) === normalizedHash(referenceSource),
  fixture: "GET returns []; POST #1 deferred then503; POST #2 valid synthetic201; DATABASE_URL blank in server",
  captures: [],
};
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "no-preference", serviceWorkers: "block" });
    const page = await context.newPage();
    let posts = 0;
    let finishPost;
    await page.route("**/api/feedback", async (route) => {
      if (route.request().method() === "GET") return route.fulfill({ json: [] });
      posts++;
      const postNumber = posts;
      await new Promise((resolve) => { finishPost = resolve; });
      if (postNumber === 1) return route.fulfill({ status: 503, body: "Local baseline fixture failure" });
      return route.fulfill({ status: 201, json: {
        id: postNumber, ...route.request().postDataJSON(), createdAt: "2026-10-16T00:00:00.000Z",
      } });
    });
    const capture = async (state) => {
      const filename = `${viewport.width}x${viewport.height}-${state}-baseline-shell35-local-fixture.png`;
      const observations = await page.evaluate(() => ({
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        focusName: document.activeElement?.getAttribute("name") ?? null,
        scrollY,
        talk: document.querySelector('[name="talkId"]').value,
        author: document.querySelector('[name="author"]').value,
        comment: document.querySelector('[name="comment"]').value,
        selectedRating: document.querySelector('[name="rating"]:checked')?.value ?? null,
      }));
      await page.screenshot({ path: path.join(output, filename), fullPage: true });
      metadata.captures.push({ filename, state, viewport, posts, ...observations });
    };
    const fill = async () => {
      await page.getByLabel("Talk", { exact: true }).fill("Baseline fixture talk");
      await page.getByLabel("Your name", { exact: true }).fill("Fixture attendee");
      await page.getByLabel("Comment (optional)", { exact: true }).fill("Retain this baseline fixture comment");
      await page.getByRole("radio", { name: "4 stars", exact: true }).check();
    };
    await page.goto(origin.href);
    await expect(page.locator("#feedback")).toBeVisible();
    await capture("untouched");
    await page.getByLabel("Talk", { exact: true }).focus();
    await capture("focused");
    await fill();
    await expect(page.getByText("4 of 5 stars selected", { exact: true })).toBeVisible();
    await capture("selected-rating");
    await page.reload();
    await page.getByRole("button", { name: "Send feedback", exact: true }).click();
    await expect(page.getByText("talkId is required", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Talk", { exact: true })).toBeFocused();
    await capture("validation-errors");
    await fill();
    await page.getByRole("button", { name: "Send feedback", exact: true }).click();
    await expect(page.getByRole("button", { name: /Saving/ })).toBeDisabled();
    await expect.poll(() => posts).toBe(1);
    await capture("saving");
    finishPost();
    await expect(page.locator("#feedback").getByRole("alert")).toBeVisible();
    await expect(page.getByLabel("Comment (optional)", { exact: true })).toHaveValue("Retain this baseline fixture comment");
    await expect(page.getByRole("radio", { name: "4 stars", exact: true })).toBeChecked();
    await capture("server-failure");
    // Original baseline retry uses the existing Send feedback button.
    await page.getByRole("button", { name: "Send feedback", exact: true }).click();
    await expect.poll(() => posts).toBe(2);
    finishPost();
    await expect(page.getByText("Feedback saved", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Talk", { exact: true })).toHaveValue("");
    await capture("saved");
    await context.close();
  }
  metadata.completedAt = new Date().toISOString();
  metadata.captureCount = metadata.captures.length;
  await writeFile(path.join(output, "metadata.json"), JSON.stringify(metadata, null, 2) + "\n");
  console.log(JSON.stringify({ commit, captures: metadata.captureCount, formMatchesMain: metadata.formSourceMatchesMainC69fa31, output }));
} finally {
  await browser.close();
}
