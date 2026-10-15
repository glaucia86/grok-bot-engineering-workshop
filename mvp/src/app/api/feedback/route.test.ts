import { beforeEach, describe, expect, it, vi } from "vitest";

const boundary = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("@/db", () => boundary);
import { GET, POST } from "./route";

const valid = { talkId: " t1 ", author: " Ana ", comment: " Great ", rating: 5 };
const request = (body: unknown) => new Request("http://localhost/api/feedback", {
  method: "POST", body: JSON.stringify(body),
});
beforeEach(() => vi.resetAllMocks());

describe("actual handlers with mocked database boundary", () => {
  const invalid: [string, unknown, string][] = [];
  for (const field of ["talkId", "author", "comment"]) {
    for (const value of [undefined, null, "", "   ", 42, {}, []]) {
      invalid.push([`${field}: ${JSON.stringify(value)}`, { ...valid, [field]: value }, field]);
    }
  }
  for (const rating of [undefined, null, 0, 6, 2.5, "5", true]) {
    invalid.push([`rating: ${rating}`, { ...valid, rating }, "rating"]);
  }
  invalid.push(["long comment", { ...valid, comment: "x".repeat(1001) }, "comment"]);
  it.each(invalid)("rejects %s without database access", async (_, body, field) => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
    expect((await response.json()).errors[field]).toEqual(expect.any(String));
    expect(boundary.getDb).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON without database access", async () => {
    const response = await POST(new Request("http://localhost/api/feedback", { method: "POST", body: "{" }));
    expect(response.status).toBe(400);
    expect((await response.json()).errors.body).toEqual(expect.any(String));
    expect(boundary.getDb).not.toHaveBeenCalled();
  });
  it.each([1, 5])("saves normalized values and returns the stored record (rating %s)", async (rating) => {
    const normalized = { talkId: "t1", author: "Ana", comment: "Great", rating };
    const row = { ...normalized, id: 7, createdAt: "2026-01-01T00:00:00.000Z" };
    const values = vi.fn(() => ({ returning: async () => [row] }));
    boundary.getDb.mockReturnValue({ insert: () => ({ values }) });
    const response = await POST(request({ ...valid, rating, extra: "discard" }));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(row);
    expect(values).toHaveBeenCalledWith(normalized);
  });
  it("returns empty statistics", async () => {
    boundary.getDb.mockReturnValue({ select: () => ({ from: async () => [] }) });
    expect(await (await GET()).json()).toEqual([]);
  });
  it("combines case variants in GET while retaining their original spelling in POST", async () => {
    const rows = [
      { talkId: "Talk A", author: "Ana", comment: "Great", rating: 5 },
      { talkId: "talk a", author: "Ana", comment: "Great", rating: 4 },
    ];
    for (const row of rows) {
      const values = vi.fn(() => ({ returning: async () => [row] }));
      boundary.getDb.mockReturnValue({ insert: () => ({ values }) });
      const response = await POST(request(row));
      expect(response.status).toBe(201);
      expect(await response.json()).toEqual(row);
      expect(values).toHaveBeenCalledWith(row);
    }
    boundary.getDb.mockReturnValue({ select: () => ({ from: async () => rows }) });
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { talkId: "Talk A", average: 4.5, count: 2 },
    ]);
  });
  it("returns one-decimal averages and counts per talk", async () => {
    boundary.getDb.mockReturnValue({ select: () => ({ from: async () => [
      { talkId: "a", rating: 5 }, { talkId: "a", rating: 4 },
      { talkId: "a", rating: 4 }, { talkId: "b", rating: 1 },
    ] }) });
    expect(await (await GET()).json()).toEqual([
      { talkId: "a", average: 4.3, count: 3 }, { talkId: "b", average: 1, count: 1 },
    ]);
  });
  it("does not return success when the database fails", async () => {
    boundary.getDb.mockImplementation(() => { throw new Error("database unavailable"); });
    await expect(POST(request(valid))).rejects.toThrow("database unavailable");
    await expect(GET()).rejects.toThrow("database unavailable");
  });
});
