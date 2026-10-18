import { expect, it, vi, beforeEach } from "vitest";
import { type SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { feedback } from "@/db/schema";
import { summarize } from "@/lib/stats";
const boundary = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("@/db", () => boundary);
import { GET } from "./route";
beforeEach(() => vi.resetAllMocks());

type Row = Pick<typeof feedback.$inferSelect, "talkId" | "rating" | "comment" | "createdAt">;
function mockRows(rows: Row[], snapshots: Row[][] = [rows]) {
  const materialized: Row[] = [];
  const nextSnapshot = () => snapshots.length > 1 ? snapshots.shift()! : snapshots[0];
  const where = vi.fn(async (condition: SQL) => {
    const query = new PgDialect().sqlToQuery(condition);
    const selected = nextSnapshot().filter(row => query.params.includes(row.talkId));
    materialized.push(...selected);
    return selected;
  });
  const leftJoin = vi.fn((_table: unknown, condition: SQL) => ({
    orderBy: async () => {
      const query = new PgDialect().sqlToQuery(condition);
      expect(query.sql).toContain('"feedback"."talk_id" in ($1');
      const snapshot = nextSnapshot();
      return [...new Set(snapshot.map(row => row.talkId))].flatMap<{ label: string; row: Row | null }>(label => {
        const selected = snapshot.filter(row => row.talkId === label && query.params.includes(label));
        materialized.push(...selected);
        return selected.length ? selected.map(row => ({ label, row })) : [{ label, row: null }];
      });
    },
  }));
  const select = vi.fn(() => ({ from: () => ({
    where, leftJoin,
    // Model the old unfiltered query too, so the regression fails on data access.
    then: (resolve: (value: Row[]) => unknown) => {
      materialized.push(...rows);
      return Promise.resolve(rows).then(resolve);
    },
  }) }));
  const selectDistinct = vi.fn(() => ({ from: async () =>
    [...new Set(rows.map(row => row.talkId))].map(talkId => ({ talkId })),
  }));
  boundary.getDb.mockReturnValue({
    select, selectDistinct,
    $with: () => ({ as: () => ({ talkId: feedback.talkId }) }),
    with: () => ({ select }),
  });
  return { materialized, select, selectDistinct, where, leftJoin };
}
const row = (talkId: string, rating = 5): Row => ({
  talkId, rating, comment: `Comment for ${talkId}`, createdAt: new Date("2026-10-16T10:00Z"),
});
const request = (talkId: string) => new Request(
  `http://localhost/api/feedback/insights?talkId=${encodeURIComponent(talkId)}`,
);
it("rejects a missing talk before database access", async () => {
  expect((await GET(new Request("http://localhost/api/feedback/insights"))).status).toBe(400);
  expect(boundary.getDb).not.toHaveBeenCalled();
});
it("derives exact counts and anonymous nonblank comments for one case-insensitive talk", async () => {
  mockRows([
    { talkId: "Talk A", rating: 5, comment: "Useful examples", createdAt: new Date("2026-10-16T10:00Z") },
    { talkId: "talk a", rating: 4, comment: "  ", createdAt: new Date("2026-10-16T11:00Z") },
    { talkId: "Talk A", rating: 1, comment: "<script>plain text</script>", createdAt: new Date("2026-10-16T12:00Z") },
    { talkId: "Other", rating: 2, comment: "Other talk", createdAt: new Date("2026-10-16T13:00Z") },
  ]);
  const response = await GET(new Request("http://localhost/api/feedback/insights?talkId=%20TALK%20A%20"));
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data).toEqual({ talkId: "Talk A", count: 3, average: 3.3, distribution: [1, 0, 0, 1, 1], comments: [
    { text: "<script>plain text</script>", date: "2026-10-16T12:00:00.000Z" },
    { text: "Useful examples", date: "2026-10-16T10:00:00.000Z" },
  ] });
  expect(JSON.stringify(data)).not.toMatch(/author|Ana/);
});
it("reports an unknown talk as not found rather than fabricating empty feedback", async () => {
  mockRows([]);
  expect((await GET(new Request("http://localhost/api/feedback/insights?talkId=missing"))).status).toBe(404);
});

it("materializes only matching feedback after reading distinct labels", async () => {
  const rows = [row("Talk A"), row("talk a", 4), row("Other", 1)];
  const db = mockRows(rows);
  const response = await GET(request(" TALK A "));
  expect(response.status).toBe(200);
  expect(db.materialized).toEqual(rows.slice(0, 2));
  expect(db.selectDistinct).toHaveBeenCalledWith({ talkId: feedback.talkId });
  expect(db.select).toHaveBeenCalledWith({
    label: feedback.talkId,
    row: { talkId: feedback.talkId, rating: feedback.rating,
      comment: feedback.comment, createdAt: feedback.createdAt },
  });
  expect(db.leftJoin).toHaveBeenCalledOnce();
  const data = await response.json();
  expect(data).toMatchObject(summarize(rows)[0]);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
});
it.each([
  ["İSTANBUL", "i\u0307stanbul", "istanbul"],
  ["ΟΣ", "ος", "οσ"],
  ["CAFÉ", "café", "cafe"],
  ["Talk  A", "talk  a", "talk a"],
  ["Talk A", "talk a", " Talk A "],
  ["O'Reilly", "o'reilly", "Other"],
])("preserves %s / %s grouping and excludes %s", async (label, variant, other) => {
  const rows = [row(label), row(variant, 3), row(other, 1)];
  const db = mockRows(rows);
  const data = await (await GET(request(` \t${variant}\n `))).json();
  expect(data).toMatchObject({ talkId: label, count: 2, average: 4 });
  expect(db.materialized).toEqual(rows.slice(0, 2));
});
it("skips the full projection when no distinct label matches", async () => {
  const db = mockRows([row("Other")]);
  const response = await GET(request("missing"));
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "Talk not found" });
  expect(db.select).not.toHaveBeenCalled();
  expect(response.headers.get("Cache-Control")).toBeNull();
});
it("still returns 404 when matching rows disappear between queries", async () => {
  mockRows([row("Talk A")], [[]]);
  expect((await GET(request("Talk A"))).status).toBe(404);
});
it("rejects blank requests without database access and preserves the error response", async () => {
  const response = await GET(request(" \t\n "));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "Choose a talk" });
  expect(response.headers.get("Cache-Control")).toBeNull();
  expect(boundary.getDb).not.toHaveBeenCalled();
});
it("propagates database failures instead of returning a fabricated 404", async () => {
  const db = mockRows([row("Talk A")]);
  db.leftJoin.mockImplementationOnce(() => { throw new Error("database unavailable"); });
  await expect(GET(request("Talk A"))).rejects.toThrow("database unavailable");
});

it("retries new matching spellings so the result represents one committed snapshot", async () => {
  const initial = [row("Talk A", 5), row("Other", 2)];
  const latest = [...initial, row("talk a", 1), row("Talk A", 3)];
  const db = mockRows(initial, [latest, latest]);
  const data = await (await GET(request("Talk A"))).json();
  expect(data).toMatchObject({ talkId: "Talk A", count: 3, average: 3 });
  expect(db.materialized.every(row => row.talkId !== "Other")).toBe(true);
});

it("includes new feedback for a known spelling in the same snapshot without a retry", async () => {
  const initial = [row("Talk A")];
  const db = mockRows(initial, [[...initial, row("Talk A", 1), row("Other")]]);
  expect(await (await GET(request("Talk A"))).json()).toMatchObject({ count: 2, average: 3 });
  expect(db.leftJoin).toHaveBeenCalledOnce();
  expect(db.materialized).toHaveLength(2);
});
it("can return 404 at discovery even when a matching talk is inserted afterward", async () => {
  const db = mockRows([row("Other")], [[row("Talk A")]]);
  expect((await GET(request("Talk A"))).status).toBe(404);
  expect(db.select).not.toHaveBeenCalled();
});
it("retries when the original spelling disappears and a new matching spelling replaces it", async () => {
  const db = mockRows([row("Talk A")], [[row("talk a", 2)]]);
  expect(await (await GET(request("Talk A"))).json()).toMatchObject({ talkId: "talk a", count: 1, average: 2 });
  expect(db.leftJoin).toHaveBeenCalledTimes(2);
});
it("bounds retries during sustained spelling changes without returning partial statistics", async () => {
  const db = mockRows([row("Talk A")], [
    [row("talk a"), row("Other")],
    [row("TALK A"), row("Other")],
    [row("tAlK a"), row("Other")],
  ]);
  await expect(GET(request("Talk A"))).rejects.toThrow("Talk feedback changed during lookup");
  expect(db.leftJoin).toHaveBeenCalledTimes(3);
  expect(db.materialized).toEqual([]);
});
