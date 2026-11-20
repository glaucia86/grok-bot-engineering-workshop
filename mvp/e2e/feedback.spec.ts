import { expect, test, type APIRequestContext, type Browser, type Page } from "@playwright/test";
import { blockedPreviewMessage, bypassHeaders, looksLikeVercelLogin } from "../src/lib/preview-e2e";

const SAVED = "Thanks, your feedback was saved.";

type TalkStat = { talkId: string; average: number; count: number };

function runId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function secretConfigured(): boolean {
  return Boolean(process.env.VERCEL_AUTOMATION_BYPASS_SECRET);
}

async function assertReachable(page: Page): Promise<void> {
  const bodySample = await page.locator("body").innerText().catch(() => "");
  if (!looksLikeVercelLogin(page.url(), await page.title(), bodySample)) return;
  throw new Error(blockedPreviewMessage(secretConfigured()));
}

async function openHome(page: Page): Promise<void> {
  // The dashboard GET runs in an effect, so it only starts after hydration.
  // Waiting for it avoids clicking Send before React attaches onSubmit.
  const feedbackReady = page.waitForResponse(
    (response) => {
      try {
        return new URL(response.url()).pathname === "/api/feedback" && response.request().method() === "GET";
      } catch {
        return false;
      }
    },
    { timeout: 20_000 },
  );
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await Promise.race([
      page.waitForURL(/vercel\.com\/(login|sso)/i, { timeout: 8_000 }).catch(() => undefined),
      page.getByRole("heading", { name: "Talk feedback" }).waitFor({ timeout: 15_000 }).catch(() => undefined),
    ]);
    await assertReachable(page);
    await expect(page.getByRole("heading", { name: "Talk feedback" })).toBeVisible();
    await feedbackReady;
    await expect(page.getByText("Loading ratings...")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Send feedback" })).toBeEnabled();
  } catch (error) {
    feedbackReady.catch(() => undefined);
    throw error;
  }
}

async function freshContext(browser: Browser, baseURL = process.env.PLAYWRIGHT_BASE_URL) {
  return browser.newContext({
    baseURL,
    extraHTTPHeaders: bypassHeaders(process.env.VERCEL_AUTOMATION_BYPASS_SECRET),
  });
}

async function readFeedback(request: APIRequestContext): Promise<TalkStat[]> {
  const response = await request.get("/api/feedback");
  const text = await response.text();
  if (
    response.status() === 401 ||
    response.status() === 403 ||
    looksLikeVercelLogin(response.url(), "", text)
  ) {
    throw new Error(blockedPreviewMessage(secretConfigured()));
  }
  expect(response.ok(), `GET /api/feedback returned ${response.status()}`).toBe(true);
  return JSON.parse(text) as TalkStat[];
}

function talkRow(page: Page, talkId: string) {
  return page.getByRole("listitem").filter({ hasText: talkId });
}

async function submit(page: Page, talkId: string, rating: string | null): Promise<void> {
  await page.getByRole("textbox", { name: "Talk", exact: true }).fill(talkId);
  await page.getByRole("textbox", { name: "Author", exact: true }).fill("Ada");
  await page.getByRole("textbox", { name: "Comment", exact: true }).fill("e2e");
  if (rating) await page.getByRole("radio", { name: rating }).check();
  await page.getByRole("button", { name: "Send feedback" }).click();
}

test.describe.serial("preview feedback", () => {
  let persistedTalk = "";

  test("shows an empty dashboard only for an isolated database", async ({ page, request }) => {
    test.skip(
      process.env.E2E_ISOLATED_DB !== "true",
      "Empty state requires E2E_ISOLATED_DB=true. Shared preview storage is not assumed empty, and this suite does not delete rows.",
    );
    await openHome(page);
    expect(await readFeedback(request)).toEqual([]);
    await expect(page.getByText("No feedback yet.", { exact: true })).toBeVisible();
    await expect(page.getByText("Could not load ratings.")).toHaveCount(0);
  });

  test("keeps invalid input and does not store the talk", async ({ page, request }) => {
    const absentTalk = `e2e-absent-${runId()}`;
    await openHome(page);
    const talk = page.getByRole("textbox", { name: "Talk", exact: true });
    await talk.fill("   ");
    await page.getByRole("textbox", { name: "Author", exact: true }).fill("Ada");
    await page.getByRole("button", { name: "Send feedback" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "talkId is required" })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "rating must be a number" })).toBeVisible();
    await expect(talk).toHaveValue("   ");
    await expect(page.getByRole("textbox", { name: "Author", exact: true })).toHaveValue("Ada");

    await talk.fill(absentTalk);
    await page.getByRole("button", { name: "Send feedback" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "rating must be a number" })).toBeVisible();
    await expect(talk).toHaveValue(absentTalk);

    const rows = await readFeedback(request);
    expect(rows.some((row) => row.talkId === absentTalk)).toBe(false);
  });

  test("submits two ratings and shows the one-decimal average", async ({ page }) => {
    persistedTalk = `e2e-${runId()}`;
    await openHome(page);

    await submit(page, persistedTalk, "5 stars");
    await expect(page.getByRole("status")).toHaveText(SAVED);
    await expect(page.getByRole("textbox", { name: "Talk", exact: true })).toHaveValue("");
    await expect(page.getByRole("textbox", { name: "Author", exact: true })).toHaveValue("");
    await expect(page.getByRole("textbox", { name: "Comment", exact: true })).toHaveValue("");
    await expect(page.locator('input[name="rating"]:checked')).toHaveCount(0);
    await expect(talkRow(page, persistedTalk)).toContainText("5.0 · 1 response");

    await submit(page, persistedTalk, "4 stars");
    await expect(page.getByRole("status")).toHaveText(SAVED);
    await expect(page.getByRole("textbox", { name: "Talk", exact: true })).toHaveValue("");
    await expect(page.locator('input[name="rating"]:checked')).toHaveCount(0);
    await expect(talkRow(page, persistedTalk)).toContainText("4.5 · 2 responses");
  });

  test("still shows the talk after a fresh page load", async ({ page, request }) => {
    expect(persistedTalk).not.toBe("");
    await openHome(page);
    await expect(talkRow(page, persistedTalk)).toContainText("4.5 · 2 responses");
    const rows = await readFeedback(request);
    expect(rows.find((row) => row.talkId === persistedTalk)).toEqual({
      talkId: persistedTalk,
      average: 4.5,
      count: 2,
    });
  });

  test("a new browser context still shows the talk", async ({ browser }) => {
    expect(persistedTalk).not.toBe("");
    const context = await freshContext(browser);
    const page = await context.newPage();
    try {
      await openHome(page);
      await expect(talkRow(page, persistedTalk)).toContainText("4.5 · 2 responses");
      const rows = await readFeedback(page.request);
      expect(rows.find((row) => row.talkId === persistedTalk)).toEqual({
        talkId: persistedTalk,
        average: 4.5,
        count: 2,
      });
    } finally {
      await context.close();
    }
  });

  test("a fresh deployment instance still shows the talk", async ({ browser }) => {
    const freshOrigin = process.env.E2E_FRESH_INSTANCE_URL;
    test.skip(
      !freshOrigin,
      "BLOCKED: E2E_FRESH_INSTANCE_URL is unset. PREVIEW_QA.md says a page reload is not a fresh application instance, and no second deployment or restarted server bound to the same database is configured.",
    );
    if (!freshOrigin) return;
    expect(persistedTalk).not.toBe("");
    const context = await freshContext(browser, freshOrigin);
    const page = await context.newPage();
    try {
      await openHome(page);
      await expect(talkRow(page, persistedTalk)).toContainText("4.5 · 2 responses");
      const rows = await readFeedback(page.request);
      expect(rows.find((row) => row.talkId === persistedTalk)).toEqual({
        talkId: persistedTalk,
        average: 4.5,
        count: 2,
      });
    } finally {
      await context.close();
    }
  });
});
