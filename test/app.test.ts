import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

describe("Talk Feedback API", () => {
  it("reports health", async () => {
    const res = await buildApp().inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });

  it("creates and lists feedback", async () => {
    const app = buildApp();
    const created = await app.inject({
      method: "POST",
      url: "/feedback",
      payload: { talkId: "keynote", author: "Ana", comment: "Great demo!" },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({ id: 1, talkId: "keynote", author: "Ana" });

    const list = await app.inject({ method: "GET", url: "/feedback" });
    expect(list.json()).toHaveLength(1);
  });

  it("filters by talkId", async () => {
    const app = buildApp();
    for (const talkId of ["a", "b", "a"]) {
      await app.inject({ method: "POST", url: "/feedback", payload: { talkId, author: "x", comment: "y" } });
    }
    const res = await app.inject({ method: "GET", url: "/feedback?talkId=a" });
    expect(res.json()).toHaveLength(2);
  });

  it("rejects invalid feedback with 400", async () => {
    const res = await buildApp().inject({ method: "POST", url: "/feedback", payload: { talkId: "a" } });
    expect(res.statusCode).toBe(400);
  });
});
