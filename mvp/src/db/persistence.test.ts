import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Real embedded PostgreSQL and Drizzle, substituting only the Neon HTTP adapter.
// These tests never read DATABASE_URL and do not prove remote Neon/preview behavior.
const boundary = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("@/db", () => boundary);
import { GET, POST } from "@/app/api/feedback/route";
import * as schema from "./schema";
import { GET as insights } from "@/app/api/feedback/insights/route";

let directory: string;
let client: PGlite | undefined;
async function open() {
  client = new PGlite(directory);
  await client.waitReady;
  boundary.getDb.mockReturnValue(drizzle(client, { schema }));
}
const post = (body: unknown) => POST(new Request("http://localhost/api/feedback", {
  method: "POST", body: JSON.stringify(body),
}));
const valid = { talkId: " t1 ", author: " Ana ", comment: " Great ", rating: 5 };
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "feedback-persistence-"));
  await open();
  await client!.exec(await readFile(new URL("../../drizzle/0000_stormy_jack_murdock.sql", import.meta.url), "utf8"));
}, 20000);
afterEach(async () => {
  try { await client?.close(); } finally {
    client = undefined;
    if (directory) await rm(directory, { recursive: true, force: true });
    vi.resetAllMocks();
  }
});

describe("durable isolated PostgreSQL adapter integration", () => {
  it("keeps aggregate and insights consistent across talk ID case variants", async () => {
    for (const [talkId, rating, comment] of [
      ["Talk A", 5, "First A"],
      ["talk a", 4, "Second A"],
      ["TALK A", 4, "Third A"],
      ["Talk B", 2, "Only B"],
    ] as const) {
      expect((await post({ talkId, rating, comment, author: "Ana" })).status).toBe(201);
    }

    const aggregate = await (await GET()).json();
    const talkAAggregate = aggregate.find((row: { talkId: string }) => row.talkId.toLowerCase() === "talk a");
    const talkAInsights = await (await insights(new Request("http://localhost/api/feedback/insights?talkId=talk%20a"))).json();
    const talkBInsights = await (await insights(new Request("http://localhost/api/feedback/insights?talkId=Talk%20B"))).json();

    expect(talkAAggregate).toMatchObject({ average: 4.3, count: 3 });
    expect(talkAInsights).toMatchObject({ average: talkAAggregate.average, count: talkAAggregate.count });
    expect(["Talk A", "talk a", "TALK A"]).toContain(talkAInsights.talkId);
    expect(talkAInsights.talkId).not.toBe("Talk B");
    expect(talkAInsights.comments.map((comment: { text: string }) => comment.text).sort()).toEqual(["First A", "Second A", "Third A"]);
    expect(talkBInsights).toMatchObject({ talkId: "Talk B", average: 2, count: 1 });
  });

  it("preserves Unicode grouping, request trimming and exact internal whitespace in PostgreSQL", async () => {
    const groups = [
      ["İSTANBUL", "i\u0307stanbul", "istanbul"],
      ["ΟΣ", "ος", "οσ"],
      ["CAFÉ", "café", "cafe"],
      ["Talk  A", "talk  a", "talk a"],
      ["O'Reilly", "o'reilly", "Other"],
    ];
    for (const [label, variant, other] of groups) {
      for (const [talkId, rating] of [[label, 5], [variant, 3], [other, 1]] as const) {
        expect((await post({ talkId, rating, comment: talkId, author: "Ana" })).status).toBe(201);
      }
    }
    const aggregate = await (await GET()).json();
    for (const [label, variant] of groups) {
      const response = await insights(new Request(
        `http://localhost/api/feedback/insights?talkId=${encodeURIComponent(` \t${variant}\n `)}`,
      ));
      const data = await response.json();
      const summary = aggregate.find((item: { talkId: string }) => item.talkId.toLowerCase() === variant);
      expect(data).toMatchObject({ count: 2, average: 4 });
      expect(data).toMatchObject({ count: summary.count, average: summary.average });
      expect([label, variant]).toContain(data.talkId);
      expect(data.comments.map((comment: { text: string }) => comment.text).sort()).toEqual([label, variant].sort());
      expect(response.headers.get("Cache-Control")).toBe("no-store");
    }
  });

  it("reads actual stored rating distribution and comments without exposing authors", async () => {
    await post(valid);
    await post({ ...valid, rating: 3, comment: "" });
    const response = await insights(new Request("http://localhost/api/feedback/insights?talkId=T1"));
    const data = await response.json();
    expect(data).toMatchObject({ count: 2, average: 4, distribution: [0, 0, 1, 0, 1] });
    expect(data.comments).toHaveLength(1);
    expect(data.comments[0].text).toBe("Great");
    expect(JSON.stringify(data)).not.toContain("Ana");
    expect(await (await GET()).json()).toEqual([{ talkId: "t1", average: 4, count: 2 }]);
  });
  it("starts empty", async () => {
    expect(await (await GET()).json()).toEqual([]);
  });
  it("stores normalized records with generated ID and timestamp", async () => {
    const response = await post(valid);
    expect(response.status).toBe(201);
    const row = await response.json();
    expect(row).toMatchObject({ id: 1, talkId: "t1", author: "Ana", comment: "Great", rating: 5 });
    expect(Number.isNaN(Date.parse(row.createdAt))).toBe(false);
    const stored = await client!.query("SELECT talk_id, author, comment, rating FROM feedback");
    expect(stored.rows).toEqual([{ talk_id: "t1", author: "Ana", comment: "Great", rating: 5 }]);
  });
  it("persists optional comments as non-null empty text across a database reopen", async () => {
    for (const body of [
      { talkId: " t1 ", author: " Ana ", rating: 5 },
      { ...valid, comment: "", rating: 4 },
      { ...valid, comment: " \t\n ", rating: 3 },
    ]) {
      const response = await post(body);
      expect(response.status).toBe(201);
      expect(await response.json()).toMatchObject({ talkId: "t1", author: "Ana", comment: "", rating: body.rating });
    }
    const response = await post({ ...valid, comment: `  ${"x".repeat(1000)}  `, rating: 2 });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ comment: "x".repeat(1000) });
    await client!.close(); client = undefined;
    await open();
    expect((await client!.query("SELECT comment, rating FROM feedback ORDER BY id")).rows).toEqual([
      { comment: "", rating: 5 },
      { comment: "", rating: 4 },
      { comment: "", rating: 3 },
      { comment: "x".repeat(1000), rating: 2 },
    ]);
    expect(await (await GET()).json()).toEqual([{ talkId: "t1", average: 3.5, count: 4 }]);
  });
  it("rejects invalid requests without inserting rows", async () => {
    await post(valid);
    for (const body of [{ ...valid, rating: "5" }, { ...valid, author: " " }, { ...valid, comment: "x".repeat(1001) }, ...[null, 42, true, {}, []].map((comment) => ({ ...valid, comment }))]) {
      expect((await post(body)).status).toBe(400);
    }
    expect((await client!.query("SELECT count(*)::int AS count FROM feedback")).rows).toEqual([{ count: 1 }]);
  });
  it("preserves data and aggregation after closing and reopening the database", async () => {
    for (const rating of [5, 4, 4]) expect((await post({ ...valid, rating })).status).toBe(201);
    expect((await post({ ...valid, talkId: "b", rating: 1 })).status).toBe(201);
    await client!.close(); client = undefined;
    await open();
    expect((await client!.query("SELECT count(*)::int AS count FROM feedback")).rows).toEqual([{ count: 4 }]);
    const rows = await (await GET()).json();
    expect(rows.sort((a: { talkId: string }, b: { talkId: string }) => a.talkId.localeCompare(b.talkId))).toEqual([
      { talkId: "b", average: 1, count: 1 }, { talkId: "t1", average: 4.3, count: 3 },
    ]);
  });
});
