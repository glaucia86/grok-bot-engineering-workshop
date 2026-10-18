// @vitest-environment happy-dom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { FeedbackForm } from "./feedback-form";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("starts with the homepage's valid rating and does not overwrite later edits", () => {
  const { rerender } = render(<FeedbackForm onSaved={() => {}} initialRating={4} />);
  expect((screen.getByRole("radio", { name: "4 stars" }) as HTMLInputElement).checked).toBe(true);
  expect(screen.getByText("4 of 5 stars selected")).toBeTruthy();
  fireEvent.click(screen.getByRole("radio", { name: "2 stars" }));
  rerender(<FeedbackForm onSaved={() => {}} initialRating={5} />);
  expect((screen.getByRole("radio", { name: "2 stars" }) as HTMLInputElement).checked).toBe(true);
});

it.each([0, 6, -1, 1.5, NaN, Infinity, undefined])("ignores an invalid initial rating (%s)", initialRating => {
  render(<FeedbackForm onSaved={() => {}} initialRating={initialRating} />);
  expect(screen.queryAllByRole("radio", { checked: true })).toHaveLength(0);
});

it("submits the initial rating through the unchanged API and resets it after persistence", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    id: 1, talkId: "Talk", author: "Ana", comment: "", rating: 3, createdAt: "2026-10-18T12:00:00Z",
  }), { status: 201 }));
  vi.stubGlobal("fetch", fetcher);
  render(<FeedbackForm onSaved={() => {}} initialRating={3} />);
  fireEvent.change(screen.getByLabelText("Talk"), { target: { value: "Talk" } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Ana" } });
  fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
  expect(await screen.findByText(/Feedback saved/)).toBeTruthy();
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ talkId: "Talk", author: "Ana", comment: "", rating: 3 });
  expect(screen.queryAllByRole("radio", { checked: true })).toHaveLength(0);
});
