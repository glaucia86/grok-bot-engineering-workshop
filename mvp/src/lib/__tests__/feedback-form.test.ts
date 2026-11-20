import { beforeEach, describe, expect, it, vi } from "vitest";

const boundary = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("@/db", () => boundary);

import { POST } from "@/app/api/feedback/route";
import { formatAverage, toPayload, validateFeedback, type FeedbackFormValues } from "../feedback-form";

const valid = { talkId: "t1", author: "Ana", comment: "Great", rating: 5 };
const request = (body: unknown) =>
  new Request("http://localhost/api/feedback", {
    method: "POST",
    body: JSON.stringify(body),
  });

beforeEach(() => vi.resetAllMocks());

describe("toPayload", () => {
  it("converts rating none, 1, 5, and a string from the input", () => {
    expect(toPayload({ ...valid, rating: undefined }).rating).toBeUndefined();
    expect(toPayload({ ...valid, rating: "" }).rating).toBeUndefined();
    expect(toPayload({ ...valid, rating: 1 }).rating).toBe(1);
    expect(toPayload({ ...valid, rating: 5 }).rating).toBe(5);
    expect(toPayload({ ...valid, rating: "1" }).rating).toBe(1);
    expect(toPayload({ ...valid, rating: "5" }).rating).toBe(5);
  });

  it("normalizes blank and whitespace comments to an empty string", () => {
    expect(toPayload({ ...valid, comment: "" }).comment).toBe("");
    expect(toPayload({ ...valid, comment: "   " }).comment).toBe("");
    expect(toPayload({ ...valid, comment: " \n\t " }).comment).toBe("");
  });
});

describe("formatAverage", () => {
  it("prints one decimal, matching stats rounding of 4.25", () => {
    expect(formatAverage(3)).toBe("3.0");
    expect(formatAverage(4.25)).toBe("4.3");
  });
});

describe("validateFeedback matches POST errors", () => {
  const invalid: [string, FeedbackFormValues][] = [
    ["missing talkId", { ...valid, talkId: undefined }],
    ["whitespace talkId", { ...valid, talkId: "   " }],
    ["missing author", { ...valid, author: undefined }],
    ["whitespace author", { ...valid, author: "   " }],
    ["missing rating", { ...valid, rating: undefined }],
    ["rating 0", { ...valid, rating: 0 }],
    ["rating 6", { ...valid, rating: 6 }],
    ["1001-char comment", { ...valid, comment: "x".repeat(1001) }],
    ["null comment", { ...valid, comment: null }],
  ];

  it.each(invalid)("%s", async (_name, values) => {
    const response = await POST(request(toPayload(values)));
    expect(response.status).toBe(400);
    expect(validateFeedback(values)).toEqual((await response.json()).errors);
    expect(boundary.getDb).not.toHaveBeenCalled();
  });
});
