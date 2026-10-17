import { expect, it, vi, beforeEach } from "vitest";
const boundary = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("@/db", () => boundary);
import { GET } from "./route";
beforeEach(() => vi.resetAllMocks());
it("rejects a missing talk before database access", async () => {
  expect((await GET(new Request("http://localhost/api/feedback/insights"))).status).toBe(400);
  expect(boundary.getDb).not.toHaveBeenCalled();
});
it("derives exact counts and anonymous nonblank comments for one case-insensitive talk", async () => {
  boundary.getDb.mockReturnValue({ select: () => ({ from: async () => [
    { talkId: "Talk A", rating: 5, comment: "Useful examples", createdAt: new Date("2026-10-16T10:00Z") },
    { talkId: "talk a", rating: 4, comment: "  ", createdAt: new Date("2026-10-16T11:00Z") },
    { talkId: "Talk A", rating: 1, comment: "<script>plain text</script>", createdAt: new Date("2026-10-16T12:00Z") },
    { talkId: "Other", rating: 2, comment: "Other talk", createdAt: new Date("2026-10-16T13:00Z") },
  ] }) });
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
  boundary.getDb.mockReturnValue({ select: () => ({ from: async () => [] }) });
  expect((await GET(new Request("http://localhost/api/feedback/insights?talkId=missing"))).status).toBe(404);
});
