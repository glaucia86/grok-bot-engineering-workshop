// @vitest-environment happy-dom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TalkResults } from "./feedback-dashboard";
import { FeedbackForm } from "./feedback-form";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("the standalone results empty state leads to the feedback route", () => {
  render(<TalkResults talks={[]} feedbackHref="/feedback" />);
  expect(screen.getByRole("link", { name: "Leave feedback" }).getAttribute("href")).toBe("/feedback");
});
it("standalone feedback confirms the save before offering the results route", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 201, json: async () => ({ id: 1, talkId: "Route QA", author: "Synthetic attendee", rating: 4, comment: "", createdAt: "2026-10-16T00:00:00Z" }) }));
  const saved = vi.fn();
  render(<FeedbackForm onSaved={saved} resultsHref="/results" />);
  fireEvent.change(screen.getByLabelText("Talk"), { target: { value: "Route QA" } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Synthetic attendee" } });
  fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
  fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
  expect((await screen.findByRole("link", { name: "View results" })).getAttribute("href")).toBe("/results");
  expect(saved).toHaveBeenCalledOnce();
});
