import { z } from "zod";

const requiredText = (field: string) =>
  z
    .string({ error: `${field} must be text` })
    .trim()
    .min(1, { error: `${field} is required` });

export const feedbackSchema = z.object({
  talkId: requiredText("talkId"),
  author: requiredText("author"),
  // Keep optional comments compatible with the existing NOT NULL text column.
  comment: z
    .string({ error: "comment must be text" })
    .trim()
    .max(1000, { error: "comment must be at most 1000 characters" })
    .default(""),
  rating: z
    .number({ error: "rating must be a number" })
    .int({ error: "rating must be a whole number" })
    .min(1, { error: "rating must be between 1 and 5" })
    .max(5, { error: "rating must be between 1 and 5" }),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "body");
    out[key] ??= issue.message;
  }
  return out;
}
