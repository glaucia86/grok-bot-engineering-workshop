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
