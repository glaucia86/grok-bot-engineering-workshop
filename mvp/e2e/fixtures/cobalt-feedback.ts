import type { Page } from "@playwright/test";
import { summarize } from "../../src/lib/stats";
import fixture from "./cobalt-records.json";
export const records = fixture.records;
export const fixtureTalks = [...new Set(records.map(row => row.talkId))];
export const summaries = summarize(records);
export function insightFor(name: string, source = records) {
  const rows = source.filter(row => row.talkId.toLowerCase() === name.toLowerCase());
  const distribution = [0,0,0,0,0]; rows.forEach(row => distribution[row.rating - 1]++);
  return { ...summarize(rows)[0], distribution, comments: rows.filter(row => row.comment).reverse().map(row => ({ text: row.comment, date: row.createdAt })) };
}
export async function mockCobaltFeedback(page: Page) {
  await page.route("**/api/feedback", route => route.fulfill({ json: summaries }));
  await page.route("**/api/feedback/insights?*", route => route.fulfill({ json: insightFor(new URL(route.request().url()).searchParams.get("talkId")!) }));
}
