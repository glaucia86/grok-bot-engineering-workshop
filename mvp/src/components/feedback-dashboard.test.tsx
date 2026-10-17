// @vitest-environment happy-dom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FeedbackDashboard, TalkResults } from "./feedback-dashboard";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("fetches initial results and refreshes after a submission revision", async () => {
  const fetchFeedback = vi.fn()
    .mockResolvedValueOnce(new Response("[]"))
    .mockResolvedValueOnce(new Response(JSON.stringify([{ talkId: "Bot workshop", average: 4.3, count: 4 }])));
  vi.stubGlobal("fetch", fetchFeedback);
  const { rerender } = render(<FeedbackDashboard />);
  expect(await screen.findByText("No feedback yet")).toBeTruthy();
  rerender(<FeedbackDashboard revision={1} />);
  expect(await screen.findByRole("rowheader", { name: "Bot workshop" })).toBeTruthy();
  expect(screen.getByText("4.3", { selector: "td" })).toBeTruthy();
  expect(fetchFeedback).toHaveBeenCalledTimes(2);
});

it("shows a recoverable error instead of reporting failed requests as empty", async () => {
  const fetchFeedback = vi.fn()
    .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))
    .mockResolvedValueOnce(new Response("[]"));
  vi.stubGlobal("fetch", fetchFeedback);
  render(<FeedbackDashboard />);
  expect((await screen.findByRole("alert")).textContent).toContain("load the feedback");
  expect(screen.queryByText("No feedback yet")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("No feedback yet")).toBeTruthy();
});

it("aborts a superseded request so older results cannot replace new feedback", async () => {
  let firstSignal: AbortSignal | undefined;
  const fetchFeedback = vi.fn().mockImplementationOnce((_url, options) => {
    firstSignal = options.signal;
    return new Promise(() => {});
  }).mockResolvedValueOnce(new Response("[]"));
  vi.stubGlobal("fetch", fetchFeedback);
  const { rerender } = render(<FeedbackDashboard />);
  await waitFor(() => expect(fetchFeedback).toHaveBeenCalledTimes(1));
  rerender(<FeedbackDashboard revision={1} />);
  expect(await screen.findByText("No feedback yet")).toBeTruthy();
  expect(firstSignal?.aborted).toBe(true);
});

it("announces the initial loading state before fetching results", () => {
  const html = renderToStaticMarkup(<FeedbackDashboard />);
  expect(html).toContain('role="status"');
  expect(html).toContain("Loading feedback");
});

it("keeps saved feedback distinct from a failed refresh and retries the results", async () => {
  const talks = [{ talkId: "Saved talk", average: 4, count: 1 }];
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(talks)))
    .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))
    .mockResolvedValueOnce(new Response(JSON.stringify([{ ...talks[0], count: 2 }]))));
  const { rerender } = render(<FeedbackDashboard />);
  await screen.findByRole("rowheader", { name: "Saved talk" });
  rerender(<FeedbackDashboard revision={1} />);
  expect((await screen.findByRole("alert")).textContent).toContain("Feedback saved. Results could not refresh");
  expect(screen.getByText(/Previously loaded results/)).toBeTruthy();
  expect(screen.getByRole("rowheader", { name: "Saved talk" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(screen.getByText("2", { selector: "td" })).toBeTruthy());
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.queryByText(/Previously loaded results/)).toBeNull();
});

it("keeps the previous results visible while a real refresh is pending", async () => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response('[{"talkId":"Existing talk","average":3,"count":1}]'))
    .mockImplementationOnce(() => new Promise(() => {})));
  const { rerender } = render(<FeedbackDashboard />);
  await screen.findByRole("rowheader", { name: "Existing talk" });
  rerender(<FeedbackDashboard revision={1} />);
  expect(screen.getByRole("status").textContent).toContain("Refreshing results");
  expect(screen.getByRole("rowheader", { name: "Existing talk" })).toBeTruthy();
});

it("hides an outdated empty prompt while the first saved response is refreshing or fails", async () => {
  let settleRefresh: ((response: Response) => void) | undefined;
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response("[]"))
    .mockImplementationOnce(() => new Promise<Response>(resolve => { settleRefresh = resolve; }))
    .mockResolvedValueOnce(new Response("[]")));
  const { rerender } = render(<FeedbackDashboard />);
  expect(await screen.findByRole("heading", { name: "No feedback yet" })).toBeTruthy();
  rerender(<FeedbackDashboard revision={1} />);
  expect(screen.getByRole("status").textContent).toContain("Refreshing results");
  expect(screen.queryByRole("heading", { name: "No feedback yet" })).toBeNull();
  expect(screen.queryByText(/Leave the first review/)).toBeNull();
  expect(screen.queryByText(/Previously loaded results/)).toBeNull();
  await waitFor(() => expect(settleRefresh).toBeDefined());
  settleRefresh!(new Response("Unavailable", { status: 503 }));
  expect((await screen.findByRole("alert")).textContent).toContain("Feedback saved. Results could not refresh");
  expect(screen.queryByRole("heading", { name: "No feedback yet" })).toBeNull();
  expect(screen.queryByText(/Leave the first review/)).toBeNull();
  expect(screen.queryByText(/Previously loaded results/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("heading", { name: "No feedback yet" })).toBeTruthy();
});

describe("TalkResults", () => {
  it("renders twenty full labels, readable values and proportional horizontal bars without growing the chart width", () => {
    const talks = Array.from({ length: 20 }, (_, index) => ({
      talkId: `${index}-${"unbroken".repeat(20)}`, average: index === 0 ? 4.3 : 3, count: index + 1,
    }));
    const { container, rerender } = render(<TalkResults talks={talks} />);
    const bars = container.querySelectorAll<HTMLElement>(".dashboard-bar-fill");
    expect(bars).toHaveLength(20);
    expect(bars[0].style.width).toBe("86%");
    expect(bars[1].style.width).toBe("60%");
    expect(screen.getAllByText(talks[0].talkId)).toHaveLength(5);
    expect(screen.getByText("4.3", { selector: ".dashboard-bar-average" })).toBeTruthy();
    expect(screen.getByText("20 responses")).toBeTruthy();
    const firstBar = bars[0];
    rerender(<TalkResults talks={talks.map((talk) => ({ ...talk }))} />);
    expect(container.querySelector(".dashboard-bar-fill")).toBe(firstBar);
    rerender(<TalkResults talks={talks.map((talk, index) => index ? talk : { ...talk, average: 5 })} />);
    expect(container.querySelector(".dashboard-bar-fill")).not.toBe(firstBar);
    expect(container.querySelector<HTMLElement>(".dashboard-bar-fill")?.style.width).toBe("100%");
  });
  it("explains how to populate the empty dashboard", () => {
    const html = renderToStaticMarkup(<TalkResults talks={[]} />);
    expect(html).toContain("No feedback yet");
    expect(html).toContain("first review");
    expect(html).not.toContain("<table");
  });

  it("lists every talk with its count and one-decimal average", () => {
    const html = renderToStaticMarkup(<TalkResults talks={[
      { talkId: "Engineering with bots", average: 4.3, count: 4 },
      { talkId: "Ship thoughtfully", average: 3, count: 1 },
    ]} />);
    expect(html).toContain("Engineering with bots");
    expect(html).toContain("Ship thoughtfully");
    expect(html).toContain("4.3");
    expect(html).toContain("3.0");
    expect(html).toContain('<td class="dashboard-count">4</td>');
    expect(html).toContain('<td class="dashboard-count">1</td>');
    expect(html).toContain('scope="col">Average');
    expect(html).toContain('scope="col">Responses');
    expect(html).toContain('scope="row">Engineering with bots');
  });

  it("gives the chart a description and an accessible data counterpart", () => {
    const html = renderToStaticMarkup(<TalkResults talks={[
      { talkId: "<Workshop>", average: 5, count: 2 },
    ]} />);
    expect(html).toContain("Average ratings by talk, from 0 to 5");
    expect(html).toContain("Exact values are listed in the table below");
    expect(html).toContain("<caption");
    expect(html).toContain("&lt;Workshop&gt;");
  });
});

it("offers a talk selector, response totals and the weighted overall mean", () => {
  render(<TalkResults talks={[{ talkId: "First", average: 4.3, count: 4 }, { talkId: "Second", average: 2, count: 2 }]} />);
  expect(screen.getByLabelText("Explore a talk")).toBeTruthy();
  expect(screen.getByText("Most reviewed talk")).toBeTruthy();
  expect(Boolean(screen.getByLabelText("Explore a talk").compareDocumentPosition(screen.getByRole("button", { name: "First" })) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  expect(screen.getByText("6", { selector: ".results-total" })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Explore a talk"), { target: { value: "Second" } });
  expect(screen.getByRole("heading", { name: "Second", level: 3 })).toBeTruthy();
  expect(screen.getByText("Overall average")).toBeTruthy();
  expect(screen.getByText("3.5", { selector: ".results-average" })).toBeTruthy();
  expect(screen.queryByText(/trending/i)).toBeNull();
});

it("shows weighted workshop average, top-rated talk and ranks comparison bars", () => {
  render(<TalkResults talks={[
    { talkId: "Popular", average: 3, count: 8 },
    { talkId: "Top rated", average: 5, count: 2 },
    { talkId: "Middle", average: 4, count: 1 },
  ]} />);
  expect(screen.getByText("3.5", { selector: ".results-average" })).toBeTruthy();
  expect(screen.getByText("Top-rated talk")).toBeTruthy();
  expect(screen.getByText("Top rated", { selector: ".results-top-rated p" })).toBeTruthy();
  const ranked = screen.getAllByRole("button", { name: /Popular|Top rated|Middle/ });
  expect(ranked.map(button => button.textContent)).toEqual(["Top rated", "Middle", "Popular"]);
});
