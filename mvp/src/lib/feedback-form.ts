import { feedbackSchema, fieldErrors } from "@/lib/feedback-schema";

export type FeedbackFormValues = {
  talkId?: unknown;
  author?: unknown;
  comment?: unknown;
  rating?: unknown;
};

export function toPayload(values: FeedbackFormValues) {
  return {
    talkId: values.talkId,
    author: values.author,
    comment: toComment(values.comment),
    rating: toRating(values.rating),
  };
}

export function validateFeedback(values: FeedbackFormValues): Record<string, string> {
  const parsed = feedbackSchema.safeParse(toPayload(values));
  if (parsed.success) return {};
  return fieldErrors(parsed.error);
}

export function formatAverage(n: number): string {
  return n.toFixed(1);
}

function toComment(comment: unknown): unknown {
  if (comment === undefined) return "";
  if (typeof comment !== "string") return comment;
  return comment.trim();
}

function toRating(rating: unknown): number | undefined {
  if (typeof rating === "number") return Number.isFinite(rating) ? rating : undefined;
  if (typeof rating !== "string") return undefined;
  const trimmed = rating.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}
