import { describe, expect, it } from "vitest";
import { feedbackSchema } from "../feedback-schema";
import { roundedMean, summarize, talkKey } from "../stats";

const valid = { talkId: "t1", author: "Ana", comment: "Great", rating: 5 };

describe("feedbackSchema", () => {
  it("accepts and trims valid input", () => {
    const r = feedbackSchema.parse({ ...valid, author: "  Ana  " });
    expect(r.author).toBe("Ana");
  });
  it.each(["talkId", "author"])("rejects missing, empty and blank %s", (f) => {
    for (const v of [undefined, "", "   ", 42]) {
      expect(feedbackSchema.safeParse({ ...valid, [f]: v }).success).toBe(false);
    }
  });
  it.each([
    { talkId: "t1", author: "Ana", rating: 5 },
    { ...valid, comment: undefined },
    { ...valid, comment: "" },
    { ...valid, comment: " \t\n " },
  ])("normalizes an optional comment to an empty string: %j", (input) => {
    expect(feedbackSchema.parse(input)).toEqual({ ...valid, comment: "" });
  });
  it.each([[null], [42], [true], [{}], [[]]])("rejects a supplied nonstring comment: %j", (comment) => {
    expect(feedbackSchema.safeParse({ ...valid, comment }).success).toBe(false);
  });
  it("rejects comments over 1000 chars", () => {
    expect(feedbackSchema.safeParse({ ...valid, comment: "x".repeat(1001) }).success).toBe(false);
    expect(feedbackSchema.safeParse({ ...valid, comment: "x".repeat(1000) }).success).toBe(true);
  });
  it.each([1, 1000, 1001])("validates comment boundary %s after trimming", (length) => {
    const result = feedbackSchema.safeParse({ ...valid, comment: `  ${"x".repeat(length)}  ` });
    expect(result.success).toBe(length <= 1000);
    if (result.success) expect(result.data.comment.length).toBe(length);
  });
  it.each([[undefined], [0], [6], [2.5], ["5"]])("rejects rating %s", (rating) => {
    expect(feedbackSchema.safeParse({ ...valid, rating }).success).toBe(false);
  });
  it.each([[1], [5]])("accepts rating %s", (rating) => {
    expect(feedbackSchema.safeParse({ ...valid, rating }).success).toBe(true);
  });
});

describe("summarize", () => {
  it("rounds the exact 4.25 half boundary up to 4.3", () => {
    expect(summarize([5, 4, 4, 4].map((rating) => ({ talkId: "Talk", rating })))).toEqual([{ talkId: "Talk", average: 4.3, count: 4 }]);
  });
  it("groups case variants while preserving the first spelling and input rows", () => {
    const rows = [
      { talkId: "Talk A", rating: 5 },
      { talkId: "talk a", rating: 4 },
      { talkId: "TALK A", rating: 4 },
      { talkId: "Talk B", rating: 2 },
    ];
    const original = structuredClone(rows);
    expect(summarize(rows)).toEqual([
      { talkId: "Talk A", average: 4.3, count: 3 },
      { talkId: "Talk B", average: 2, count: 1 },
    ]);
    expect(rows).toEqual(original);
  });
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

describe("stats helpers", () => {
  it.each([
    [17, 4, 4.3],
    [10, 3, 3.3],
    [5, 1, 5],
  ])("rounds the mean of %s / %s to one decimal", (sum, count, expected) => {
    expect(roundedMean(sum, count)).toBe(expected);
  });

  it("creates a case-insensitive talk grouping key", () => {
    expect(talkKey("Talk A")).toBe(talkKey("TALK A"));
    expect(talkKey("Talk A")).not.toBe(talkKey("Talk B"));
  });
});
