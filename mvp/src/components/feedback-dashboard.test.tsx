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

describe("TalkResults", () => {
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
