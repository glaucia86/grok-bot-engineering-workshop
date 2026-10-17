// @vitest-environment happy-dom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { render, cleanup, screen, fireEvent, waitFor } from "@testing-library/react";
import { TalkInsights } from "./talk-insights";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const data = { talkId: "Talk A", count: 4, average: 4, distribution: [0, 0, 1, 2, 1], comments: [{ text: "Useful examples", date: "2026-10-16T12:00:00Z" }] };
it("shows real distribution, favorable share and comments without inventing a trend", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(data))));
  render(<TalkInsights talkId="Talk A" />);
  expect(await screen.findByText("Useful examples")).toBeTruthy();
  expect(screen.getByText("75% rated 4 or 5")).toBeTruthy();
  expect(screen.getByRole("listitem", { name: "5 stars: 1 rating (25%)" })).toBeTruthy();
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


it("labels the comment collection and explains its real count", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(data))));
  render(<TalkInsights talkId="Talk A" />);
  const comments = await screen.findByRole("list", { name: "Written feedback comments" });
  expect(comments.querySelectorAll("li")).toHaveLength(1);
  expect(screen.getByText("1 comment", { exact: true })).toBeTruthy();
  expect(comments.querySelector("time")?.getAttribute("datetime")).toBe(data.comments[0].date);
});

it("shows an honest zero-response detail without invalid percentages", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...data, count: 0, average: 0, distribution: [0, 0, 0, 0, 0], comments: [] }))));
  const { container } = render(<TalkInsights talkId="Talk A" />);
  expect(await screen.findByText("No written comments yet.")).toBeTruthy();
  expect(screen.getByText("No ratings yet", { exact: true })).toBeTruthy();
  expect(container.textContent).not.toMatch(/NaN|Infinity|0% rated/);
  expect(container.querySelectorAll(".rating-distribution li")).toHaveLength(5);
  expect(Array.from(container.querySelectorAll(".rating-distribution li strong")).map(node => node.textContent)).toEqual(["0","0","0","0","0"]);
});


it("renders a real shadcn Recharts visualization with all five exact-count fallback bins", async () => {
  // Happy DOM has no layout engine. Give the real ResponsiveContainer a measured viewport.
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ x: 0, y: 0, width: 640, height: 230, top: 0, right: 640, bottom: 230, left: 0, toJSON: () => ({}) });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(data))));
  const { container } = render(<TalkInsights talkId="Talk A" />);
  await screen.findByText("Useful examples");
  expect(screen.getByRole("figure", { name: "Rating distribution for Talk A" })).toBeTruthy();
  expect(screen.getByText("Individual ratings · counts by score", { exact: true })).toBeTruthy();
  await waitFor(() => expect(container.querySelector('[data-slot="chart"] .recharts-surface')).toBeTruthy());
  expect(Array.from(container.querySelectorAll(".rating-distribution li strong")).map(node => node.textContent)).toEqual(["0", "0", "1", "2", "1"]);
  expect(Array.from(container.querySelectorAll(".distribution-percentage")).map(node => node.textContent)).toEqual(["0%", "0%", "25%", "50%", "25%"]);
  expect(Array.from(container.querySelectorAll(".distribution-rating")).map(node => node.textContent)).toEqual(["1 star", "2 stars", "3 stars", "4 stars", "5 stars"]);
});

it("treats one response as an early signal rather than a confident room-wide verdict", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...data, count: 1, average: 5, distribution: [0,0,0,0,1], comments: [] }))));
  render(<TalkInsights talkId="Talk A" />);
  expect(await screen.findByText("Based on 1 response. This is an early signal.")).toBeTruthy();
  expect(screen.getByRole("listitem", { name: "5 stars: 1 rating (100%)" })).toBeTruthy();
  expect(screen.queryByText(/trending|growth|excellent/i)).toBeNull();
});

it("keeps the comparison slot visible during loading and failed detail retrieval", async () => {
  let release: ((value: Response) => void) | undefined;
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(resolve => { release = resolve; })));
  render(<TalkInsights talkId="Talk A" comparison={<section aria-label="Comparison retained">Exact talk totals</section>} />);
  expect(screen.getByRole("region", { name: "Comparison retained" })).toBeTruthy();
  expect(screen.getByText("Loading rating details.")).toBeTruthy();
  release!(new Response("Unavailable", { status: 503 }));
  await screen.findByRole("button", { name: "Retry details" });
  expect(screen.getByRole("region", { name: "Comparison retained" })).toBeTruthy();
});

it("fits five nonzero library bars into a narrow measured chart without overlap", async () => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ x: 0, y: 0, width: 240, height: 230, top: 0, right: 240, bottom: 230, left: 0, toJSON: () => ({}) });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...data, count: 5, average: 3, distribution: [1,1,1,1,1] }))));
  const { container } = render(<TalkInsights talkId="Talk A" />);
  await waitFor(() => expect(container.querySelectorAll(".recharts-bar-rectangle path")).toHaveLength(5));
  const bars = [...container.querySelectorAll(".recharts-bar-rectangle path")].map(node => ({ x: Number(node.getAttribute("x")), width: Number(node.getAttribute("width")) }));
  for (const [index, bar] of bars.entries()) {
    expect(bar.width).toBeGreaterThan(0);
    expect(bar.x).toBeGreaterThanOrEqual(0);
    expect(bar.x + bar.width).toBeLessThanOrEqual(240);
    if (index < bars.length - 1) expect(bar.x + bar.width).toBeLessThanOrEqual(bars[index + 1].x);
  }
});
