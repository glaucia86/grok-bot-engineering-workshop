import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { feedback } from "@/db/schema";
import { roundedMean, talkKey } from "@/lib/stats";

type InsightRow = Pick<typeof feedback.$inferSelect, "talkId" | "rating" | "comment" | "createdAt">;

async function selectTalkRows(name: string): Promise<InsightRow[]> {
  const db = getDb();
  // Match labels with the same JavaScript Unicode casing as summarize(). SQL
  // lower() can disagree (for example, İ), so read labels without other talks' comments.
  const labels = await db.selectDistinct({ talkId: feedback.talkId }).from(feedback);
  const key = talkKey(name);
  let matchingIds = labels.filter(({ talkId }) => talkKey(talkId) === key).map(({ talkId }) => talkId);
  if (!matchingIds.length) return [];

  const talkLabels = db.$with("talk_labels").as(
    db.selectDistinct({ talkId: feedback.talkId }).from(feedback),
  );
  // Labels and payload share one SQL snapshot. If a new spelling appeared since
  // discovery, retry with that spelling too; never combine different snapshots.
  for (let attempt = 0; attempt < 3; attempt++) {
    const snapshot = await db.with(talkLabels).select({
      label: talkLabels.talkId,
      row: {
        talkId: feedback.talkId,
        rating: feedback.rating,
        comment: feedback.comment,
        createdAt: feedback.createdAt,
      },
    }).from(talkLabels).leftJoin(feedback, and(
      eq(feedback.talkId, talkLabels.talkId),
      inArray(feedback.talkId, matchingIds),
    )).orderBy(feedback.id);
    const currentIds = [...new Set(snapshot
      .filter(({ label }) => talkKey(label) === key)
      .map(({ label }) => label))];
    if (currentIds.every(id => matchingIds.includes(id))) {
      return snapshot.flatMap(({ row }) => row ? [row] : []);
    }
    matchingIds = currentIds;
  }
  // Like database failures, sustained concurrent changes propagate as a server
  // error rather than returning partial statistics or loading unrelated comments.
  throw new Error("Talk feedback changed during lookup; retry the request");
}

function buildDistribution(rows: InsightRow[]): number[] {
  const distribution = [0, 0, 0, 0, 0];
  for (const row of rows) distribution[row.rating - 1]++;
  return distribution;
}

function buildComments(rows: InsightRow[]) {
  return rows
    .filter(row => row.comment.trim())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map(row => ({ text: row.comment, date: row.createdAt.toISOString() }));
}

/** Additive read model; the existing aggregate GET and creation POST are unchanged.
 * Authors and identifiers are deliberately excluded from the public projection.
 */
export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get("talkId")?.trim();
  if (!name) return NextResponse.json({ error: "Choose a talk" }, { status: 400 });
  const rows = await selectTalkRows(name);
  if (!rows.length) return NextResponse.json({ error: "Talk not found" }, { status: 404 });

  return NextResponse.json({
    talkId: rows[0].talkId,
    count: rows.length,
    average: roundedMean(rows.reduce((sum, row) => sum + row.rating, 0), rows.length),
    distribution: buildDistribution(rows),
    comments: buildComments(rows),
  }, { headers: { "Cache-Control": "no-store" } });
}
