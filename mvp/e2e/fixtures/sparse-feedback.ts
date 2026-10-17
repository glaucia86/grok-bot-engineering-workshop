import type { Page } from "@playwright/test";
import { summarize } from "../../src/lib/stats";
import { insightFor } from "./cobalt-feedback";

// Exactly two synthetic responses across two talks. No persisted attendee data.
export const sparseRecords = [
  { talkId: "Workshop kickoff", rating: 5, comment: "A clear start to the workshop.", createdAt: "2026-10-16T14:00:00.000Z" },
  { talkId: "Building useful agents", rating: 4, comment: "", createdAt: "2026-10-16T14:01:00.000Z" },
];

export async function mockSparseFeedback(page: Page) {
  await page.route("**/api/feedback", route => route.fulfill({ json: summarize(sparseRecords) }));
  await page.route("**/api/feedback/insights?*", route => route.fulfill({
    json: insightFor(new URL(route.request().url()).searchParams.get("talkId")!, sparseRecords),
  }));
}
