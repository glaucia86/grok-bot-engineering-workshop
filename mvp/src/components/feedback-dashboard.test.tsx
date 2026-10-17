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
  it("renders twenty full labels, readable values and proportional horizontal bars without growing the chart width", () => {
    const talks = Array.from({ length: 20 }, (_, index) => ({
      talkId: `${index}-${"unbroken".repeat(20)}`, average: index === 0 ? 4.3 : 3, count: index + 1,
    }));
    const { container, rerender } = render(<TalkResults talks={talks} />);
    const bars = container.querySelectorAll<HTMLElement>(".dashboard-bar-fill");
    expect(bars).toHaveLength(20);
    expect(bars[0].style.width).toBe("86%");
    expect(bars[1].style.width).toBe("60%");
    expect(screen.getAllByText(talks[0].talkId)).toHaveLength(4);
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

it("offers a talk selector and actual response totals without an invented overall mean", () => {
  render(<TalkResults talks={[{ talkId: "First", average: 4.3, count: 4 }, { talkId: "Second", average: 2, count: 2 }]} />);
  expect(screen.getByLabelText("Explore a talk")).toBeTruthy();
  expect(screen.getByText("Most reviewed talk")).toBeTruthy();
  expect(Boolean(screen.getByLabelText("Explore a talk").compareDocumentPosition(screen.getByRole("button", { name: "First" })) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  expect(screen.getByText("6", { selector: ".results-total" })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Explore a talk"), { target: { value: "Second" } });
  expect(screen.getByRole("heading", { name: "Second", level: 3 })).toBeTruthy();
  expect(screen.queryByText(/overall average|trending/i)).toBeNull();
});


it("pairs each factual summary with its label in a summary-card definition list", () => {
  render(<TalkResults talks={[
    { talkId: "Engineering with bots", average: 4.3, count: 4 },
    { talkId: "Ship thoughtfully", average: 3, count: 1 },
  ]} />);
  const overview = screen.getByLabelText("Workshop response summary");
  expect(overview.tagName).toBe("DL");
  expect(within(overview).getAllByRole("term").map(term => term.textContent)).toEqual([
    "Responses received", "Talks reviewed", "Most reviewed talk",
  ]);
  expect(within(overview).getAllByRole("definition").map(definition => definition.textContent)).toEqual([
    "5", "2", "Engineering with bots4 ratings received",
  ]);
  expect(screen.queryByText(/overall average|trending|anonymous/i)).toBeNull();
});

it("names the comparison panel and keeps selection buttons and scroll access for larger workshops", () => {
  const talks = Array.from({ length: 7 }, (_, index) => ({ talkId: `Talk ${index + 1}`, average: 4, count: 1 }));
  render(<TalkResults talks={talks} />);
  const comparison = screen.getByRole("region", { name: "Across the workshop" });
  const ratings = within(comparison).getByRole("list", { name: "Average ratings and response counts" });
  expect(ratings.getAttribute("data-scroll")).toBe("true");
  expect(ratings.tabIndex).toBe(0);
  fireEvent.click(within(comparison).getByRole("button", { name: "Talk 7" }));
  expect(screen.getByLabelText("Explore a talk")).toBe(document.activeElement);
  expect(within(comparison).getByRole("button", { name: "Talk 7" }).getAttribute("aria-pressed")).toBe("true");
});


it("gives summary cards a clean surface and bounds the large comparison scroll area", () => {
  const styles = readFileSync("src/components/feedback-dashboard.css", "utf8");
  const talks = Array.from({ length: 7 }, (_, index) => ({ talkId: `Talk ${index + 1}`, average: 4, count: 1 }));
  const { container } = render(<><style>{styles}</style><section className="dashboard-root"><TalkResults talks={talks} /></section></>);
  const card = container.querySelector(".results-metric")!;
  expect(getComputedStyle(card).backgroundColor).toBe("rgb(255, 255, 255)");
  expect(getComputedStyle(card).borderRadius).toBe("12px");
  const chart = screen.getByRole("list", { name: "Average ratings and response counts" });
  expect(getComputedStyle(chart).overflowY).toBe("auto");
  expect(getComputedStyle(chart).maxHeight).toBe("560px");
});

it("keeps secondary results labels at AA contrast against their actual card surfaces", async () => {
  const styles = readFileSync("src/components/feedback-dashboard.css", "utf8");
  let refreshPending = false;
  vi.stubGlobal("fetch", vi.fn((url: string) => {
    if (url === "/api/feedback") return refreshPending ? new Promise(() => {}) : Promise.resolve(new Response('[{"talkId":"Talk A","average":4,"count":1}]'));
    return Promise.resolve(new Response(JSON.stringify({
      talkId: "Talk A", count: 1, average: 4, distribution: [0, 0, 0, 1, 0],
      comments: [{ text: "Useful feedback", date: "2026-10-17T10:00:00Z" }],
    })));
  }));
  const { container, rerender } = render(<><style>{styles}</style><FeedbackDashboard insights /></>);
  await screen.findByText("Useful feedback");
  const luminance = (color: string) => {
    const hex = color.length === 4 ? color.slice(1).split("").map(value => value + value).join("") : color.slice(1);
    const values = color.startsWith("#")
      ? hex.match(/.{2}/g)!.map(value => parseInt(value, 16))
      : color.match(/\d+/g)!.slice(0, 3).map(Number);
    const [red, green, blue] = values.map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return red * 0.2126 + green * 0.7152 + blue * 0.0722;
  };
  for (const [textSelector, surfaceSelector] of [
    [".dashboard-scale", ".results-comparison"],
    [".dashboard-bar-values", ".results-comparison"],
    [".dashboard-table thead th", ".dashboard-table-wrap"],
    [".dashboard-average span", ".dashboard-table-wrap"],
    [".rating-distribution > p", ".results-detail"],
    [".talk-comments time", ".talk-comments li"],
    [".talk-comments header > span", ".talk-comments header > span"],
  ]) {
    const foreground = luminance(getComputedStyle(container.querySelector(textSelector)!).color);
    const background = luminance(getComputedStyle(container.querySelector(surfaceSelector)!).backgroundColor);
    const contrast = (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    expect(contrast, `${textSelector} text contrast`).toBeGreaterThanOrEqual(4.5);
  }
  const selector = getComputedStyle(screen.getByLabelText("Explore a talk"));
  expect((luminance(selector.backgroundColor) + 0.05) / (luminance(selector.borderTopColor) + 0.05), "talk selector boundary contrast").toBeGreaterThanOrEqual(3);
  refreshPending = true;
  rerender(<><style>{styles}</style><FeedbackDashboard insights revision={1} /></>);
  const notice = screen.getByText(/Previously loaded results/);
  const foreground = luminance(getComputedStyle(notice).color);
  const background = luminance(getComputedStyle(notice).backgroundColor);
  expect((background + 0.05) / (foreground + 0.05), "stale notice text contrast").toBeGreaterThanOrEqual(4.5);
});
