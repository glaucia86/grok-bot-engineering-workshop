import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { feedback } from "@/db/schema";

/** Additive read model; the existing aggregate GET and creation POST are unchanged.
 * Authors and identifiers are deliberately excluded from the public projection.
 */
export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get("talkId")?.trim();
  if (!name) return NextResponse.json({ error: "Choose a talk" }, { status: 400 });
  const rows = await getDb().select({ talkId: feedback.talkId, rating: feedback.rating, comment: feedback.comment, createdAt: feedback.createdAt }).from(feedback);
  const selected = rows.filter(row => row.talkId.toLowerCase() === name.toLowerCase());
  if (!selected.length) return NextResponse.json({ error: "Talk not found" }, { status: 404 });
  const distribution = [0, 0, 0, 0, 0];
  for (const row of selected) distribution[row.rating - 1]++;
  const comments = selected.filter(row => row.comment.trim()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map(row => ({ text: row.comment, date: row.createdAt.toISOString() }));
  return NextResponse.json({
    talkId: selected[0].talkId, count: selected.length,
    average: Math.round(selected.reduce((sum, row) => sum + row.rating, 0) / selected.length * 10) / 10,
    distribution, comments,
  }, { headers: { "Cache-Control": "no-store" } });
}
