// @vitest-environment happy-dom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { TalkInsights } from "./talk-insights";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const data = { talkId: "Talk A", count: 4, average: 4, distribution: [0, 0, 1, 2, 1], comments: [{ text: "Useful examples", date: "2026-10-16T12:00:00Z" }] };
it("shows real distribution, favorable share and comments without inventing a trend", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(data))));
  render(<TalkInsights talkId="Talk A" />);
  expect(await screen.findByText("Useful examples")).toBeTruthy();
  expect(screen.getByText("75% rated 4 or 5")).toBeTruthy();
  expect(screen.getByRole("list", { name: "Rating distribution" }).textContent).toContain("5 stars1");
  expect(screen.queryByText(/trend|last week|growth/i)).toBeNull();
});
it("offers a detail-only retry without removing the comparison", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("Unavailable", { status: 503 })).mockResolvedValueOnce(new Response(JSON.stringify(data))));
  render(<TalkInsights talkId="Talk A" />);
  fireEvent.click(await screen.findByRole("button", { name: "Retry details" }));
  expect(await screen.findByText("Useful examples")).toBeTruthy();
});
it("aborts old details on talk change and never displays the previous talk's comments", async () => {
  let signal: AbortSignal | undefined;
  vi.stubGlobal("fetch", vi.fn().mockImplementationOnce((_url, options) => { signal = options.signal; return new Promise(() => {}); }).mockResolvedValueOnce(new Response(JSON.stringify({ ...data, talkId: "Talk B", comments: [] }))));
  const { rerender } = render(<TalkInsights talkId="Talk A" />);
  rerender(<TalkInsights talkId="Talk B" />);
  expect(signal?.aborted).toBe(true);
  expect(await screen.findByText("No written comments yet.")).toBeTruthy();
  expect(screen.queryByText("Useful examples")).toBeNull();
});
