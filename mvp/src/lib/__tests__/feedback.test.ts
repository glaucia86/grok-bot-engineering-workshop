import { describe, expect, it } from "vitest";
import { feedbackSchema } from "../feedback-schema";
import { summarize } from "../stats";

const valid = { talkId: "t1", author: "Ana", comment: "Great", rating: 5 };

describe("feedbackSchema", () => {
  it("accepts and trims valid input", () => {
    const r = feedbackSchema.parse({ ...valid, author: "  Ana  " });
    expect(r.author).toBe("Ana");
  });
  it.each(["talkId", "author", "comment"])("rejects missing, empty and blank %s", (f) => {
    for (const v of [undefined, "", "   ", 42]) {
      expect(feedbackSchema.safeParse({ ...valid, [f]: v }).success).toBe(false);
    }
  });
  it("rejects comments over 1000 chars", () => {
    expect(feedbackSchema.safeParse({ ...valid, comment: "x".repeat(1001) }).success).toBe(false);
    expect(feedbackSchema.safeParse({ ...valid, comment: "x".repeat(1000) }).success).toBe(true);
  });
  it.each([[undefined], [0], [6], [2.5], ["5"]])("rejects rating %s", (rating) => {
    expect(feedbackSchema.safeParse({ ...valid, rating }).success).toBe(false);
  });
  it.each([[1], [5]])("accepts rating %s", (rating) => {
    expect(feedbackSchema.safeParse({ ...valid, rating }).success).toBe(true);
  });
});

describe("summarize", () => {
  it("returns empty for no rows", () => expect(summarize([])).toEqual([]));
  it("averages per talk with one decimal", () => {
    expect(
      summarize([
        { talkId: "a", rating: 5 },
        { talkId: "a", rating: 4 },
        { talkId: "a", rating: 4 },
        { talkId: "b", rating: 3 },
      ]),
    ).toEqual([
      { talkId: "a", average: 4.3, count: 3 },
      { talkId: "b", average: 3, count: 1 },
    ]);
  });
});
