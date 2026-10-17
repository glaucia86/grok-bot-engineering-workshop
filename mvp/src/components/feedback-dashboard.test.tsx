// @vitest-environment happy-dom
import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
  it("renders one interactive comparison table with full labels and exact values", () => {
    const talks = Array.from({ length: 20 }, (_, index) => ({ talkId: `${index}-${"unbroken".repeat(20)}`, average: index === 0 ? 4.3 : 3, count: index + 1 }));
    const { container } = render(<TalkResults talks={talks} />);
    expect(screen.getAllByRole("table")).toHaveLength(1);
    expect(screen.getAllByRole("rowheader")).toHaveLength(20);
    expect(screen.getByRole("button", { name: talks[0].talkId }).textContent).toBe(talks[0].talkId);
    expect(screen.getByText("4.3", { selector: "td" })).toBeTruthy();
    expect(screen.getByText("20", { selector: ".dashboard-count" })).toBeTruthy();
    expect(container.querySelector(".dashboard-bars")).toBeNull();
    expect(screen.queryByRole("figure", { name: /Average ratings by talk/ })).toBeNull();
  });
  it("explains how to populate the empty dashboard", () => {
    const html = renderToStaticMarkup(<TalkResults talks={[]} />);
    expect(html).toContain("No feedback yet");
    expect(html).toContain("first review");
    expect(html).not.toContain("<table");
  });
  it("preserves the table's accessible headers and escapes talk labels", () => {
    render(<TalkResults talks={[{ talkId: "<Workshop>", average: 4.3, count: 4 }]} />);
    const table = screen.getByRole("table", { name: "Talk feedback summary" });
    expect(within(table).getAllByRole("columnheader").map(node => node.textContent)).toEqual(["Talk", "Average", "Responses"]);
    expect(within(table).getByRole("rowheader", { name: "<Workshop>" })).toBeTruthy();
    expect(screen.getByText("4.3", { selector: "td" })).toBeTruthy();
  });
});

it("pairs the compact factual summary with its labels without inventing an overall mean", () => {
  render(<TalkResults talks={[{ talkId: "First", average: 4.3, count: 4 }, { talkId: "Second", average: 2, count: 2 }]} />);
  const overview = screen.getByLabelText("Workshop response summary");
  expect(overview.tagName).toBe("DL");
  expect(within(overview).getAllByRole("term").map(node => node.textContent)).toEqual(["Responses received", "Talks reviewed", "Most reviewed talk"]);
  expect(within(overview).getAllByRole("definition").map(node => node.textContent)).toEqual(["6", "2", "First4 ratings received"]);
  expect(screen.queryByText(/overall average|trending|anonymous/i)).toBeNull();
});

it("keeps keyboard-native table selection before returning focus to the selected analytics", () => {
  render(<TalkResults talks={[{ talkId: "First", average: 4.3, count: 4 }, { talkId: "Second", average: 2, count: 2 }]} />);
  const button = screen.getByRole("button", { name: "Second" });
  expect(button.tagName).toBe("BUTTON");
  expect(button.getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(button);
  expect(screen.getByLabelText("Explore a talk")).toBe(document.activeElement);
  expect(screen.getByRole("region", { name: "Selected talk feedback" }).contains(screen.getByRole("heading", { name: "Second", level: 3 }))).toBe(true);
  expect(button.getAttribute("aria-pressed")).toBe("true");
  expect(button.closest("tr")?.getAttribute("data-selected")).toBe("true");
});

it("bounds large comparison tables and leaves short tables out of the scroll tab order", () => {
  const styles = readFileSync("src/components/feedback-dashboard.css", "utf8");
  const talks = Array.from({ length: 7 }, (_, index) => ({ talkId: `Talk ${index + 1}`, average: 4, count: 1 }));
  const { rerender } = render(<><style>{styles}</style><section className="dashboard-root"><TalkResults talks={talks} /></section></>);
  const scroll = screen.getByRole("region", { name: "Talk comparison rows" });
  expect(scroll.tabIndex).toBe(0);
  expect(scroll.getAttribute("data-scroll")).toBe("true");
  expect(getComputedStyle(scroll).overflowY).toBe("auto");
  expect(getComputedStyle(scroll).maxHeight).toBe("480px");
  rerender(<><style>{styles}</style><section className="dashboard-root"><TalkResults talks={talks.slice(0, 2)} /></section></>);
  expect(screen.getByRole("region", { name: "Talk comparison rows" }).hasAttribute("tabindex")).toBe(false);
});

it("uses one dominant analytics card followed by comparison and selected comments", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ talkId: "Talk A", count: 1, average: 5, distribution: [0,0,0,0,1], comments: [{ text: "A useful beginning", date: "2026-10-17T10:00:00Z" }] }))));
  const { container } = render(<TalkResults talks={[{ talkId: "Talk A", average: 5, count: 1 }, { talkId: "Talk B", average: 4, count: 1 }]} insights />);
  await screen.findByText("A useful beginning");
  const analytics = screen.getByRole("region", { name: "Selected talk feedback" });
  expect(within(analytics).getByRole("list", { name: "Rating distribution" })).toBeTruthy();
  expect(within(analytics).getByText("Based on 1 response. This is an early signal.")).toBeTruthy();
  expect(analytics.querySelector(".talk-comments")).toBeNull();
  const bottom = container.querySelector(".results-bottom-grid")!;
  expect(bottom.contains(screen.getByRole("table"))).toBe(true);
  expect(bottom.contains(screen.getByRole("list", { name: "Written feedback comments" }))).toBe(true);
  expect(container.querySelectorAll(".results-analytics")).toHaveLength(1);
});

it("keeps supporting labels at AA contrast and the selector boundary identifiable", async () => {
  const styles = readFileSync("src/components/feedback-dashboard.css", "utf8");
  let refreshPending = false;
  vi.stubGlobal("fetch", vi.fn((url: string) => {
    if (url === "/api/feedback") return refreshPending ? new Promise(() => {}) : Promise.resolve(new Response('[{"talkId":"Talk A","average":4,"count":1}]'));
    return Promise.resolve(new Response(JSON.stringify({ talkId: "Talk A", count: 1, average: 4, distribution: [0,0,0,1,0], comments: [{ text: "Useful feedback", date: "2026-10-17T10:00:00Z" }] })));
  }));
  const { container, rerender } = render(<><style>{styles}</style><FeedbackDashboard insights /></>);
  await screen.findByText("Useful feedback");
  const luminance = (color: string) => {
    const hex = color.length === 4 ? color.slice(1).split("").map(value => value + value).join("") : color.slice(1);
    const values = color.startsWith("#") ? hex.match(/.{2}/g)!.map(value => parseInt(value, 16)) : color.match(/\d+/g)!.slice(0, 3).map(Number);
    const [red, green, blue] = values.map(value => { const channel = value / 255; return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4; });
    return red * 0.2126 + green * 0.7152 + blue * 0.0722;
  };
  for (const [textSelector, surfaceSelector] of [[".insight-sample", ".results-analytics"], [".distribution-percentage", ".results-analytics"], [".dashboard-table thead th", ".results-comparison"], [".dashboard-average span", ".results-comparison"], [".rating-distribution > p", ".results-analytics"], [".talk-comments time", ".talk-comments li"], [".talk-comments header > span", ".talk-comments header > span"]]) {
    const foreground = luminance(getComputedStyle(container.querySelector(textSelector)!).color);
    const background = luminance(getComputedStyle(container.querySelector(surfaceSelector)!).backgroundColor);
    expect((Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05), `${textSelector} text contrast`).toBeGreaterThanOrEqual(4.5);
  }
  const selector = getComputedStyle(screen.getByLabelText("Explore a talk"));
  expect((luminance(selector.backgroundColor) + 0.05) / (luminance(selector.borderTopColor) + 0.05)).toBeGreaterThanOrEqual(3);
  refreshPending = true;
  rerender(<><style>{styles}</style><FeedbackDashboard insights revision={1} /></>);
  const notice = screen.getByText(/Previously loaded results/);
  expect((luminance(getComputedStyle(notice).backgroundColor) + 0.05) / (luminance(getComputedStyle(notice).color) + 0.05)).toBeGreaterThanOrEqual(4.5);
});
