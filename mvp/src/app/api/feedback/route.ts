import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { feedback } from "@/db/schema";
import { feedbackSchema, fieldErrors } from "@/lib/feedback-schema";
import { summarize } from "@/lib/stats";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }
  const [row] = await getDb().insert(feedback).values(parsed.data).returning();
  return NextResponse.json(row, { status: 201 });
}

export async function GET() {
  const rows = await getDb()
    .select({ talkId: feedback.talkId, rating: feedback.rating })
    .from(feedback);
  return NextResponse.json(summarize(rows));
}
