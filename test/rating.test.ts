import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

const post = (app: ReturnType<typeof buildApp>, payload: Record<string, unknown>) =>
  app.inject({ method: "POST", url: "/feedback", payload: { talkId: "keynote", author: "a", comment: "c", ...payload } });

describe("Talk rating", () => {
  it("accepts and echoes a rating", async () => {
    const res = await post(buildApp(), { rating: 5 });
    expect(res.statusCode).toBe(201);
    expect(res.json().rating).toBe(5);
  });

  it("keeps rating optional", async () => {
    const res = await post(buildApp(), {});
    expect(res.statusCode).toBe(201);
    expect(res.json().rating).toBeUndefined();
  });

  it.each([0, 6, 2.5, "five"])("rejects rating %s with 400", async (rating) => {
    expect((await post(buildApp(), { rating })).statusCode).toBe(400);
  });

  it("returns average and count, ignoring unrated feedback", async () => {
    const app = buildApp();
    await post(app, { rating: 5 });
    await post(app, { rating: 4 });
    await post(app, { rating: 4 });
    await post(app, {});
    await post(app, { talkId: "other", rating: 1 });
    const res = await app.inject({ method: "GET", url: "/talks/keynote/rating" });
    expect(res.json()).toEqual({ talkId: "keynote", average: 4.33, count: 3 });
  });

  it("returns null average for a talk with no ratings", async () => {
    const res = await buildApp().inject({ method: "GET", url: "/talks/none/rating" });
    expect(res.json()).toEqual({ talkId: "none", average: null, count: 0 });
  });
});
