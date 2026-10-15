// @vitest-environment happy-dom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { FeedbackForm } from "./feedback-form";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function fill() {
  fireEvent.change(screen.getByLabelText("Talk"), { target: { value: "  Engineering bots  " } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "  Ana  " } });
  fireEvent.change(screen.getByLabelText("Comment"), { target: { value: "  Useful workshop  " } });
  fireEvent.click(screen.getByRole("radio", { name: "5" }));
}
it("shows shared errors and preserves invalid input without sending", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  render(<FeedbackForm onSaved={() => {}} />);
  fireEvent.change(screen.getByLabelText("Talk"), { target: { value: "  " } });
  fireEvent.click(screen.getByRole("button", { name: /Send feedback/ }));
  expect(await screen.findByText("talkId is required")).toBeTruthy();
  expect(screen.getByText("author is required")).toBeTruthy();
  expect(screen.queryByText("comment is required")).toBeNull();
  expect(screen.getByText("rating must be a number")).toBeTruthy();
  expect((screen.getByLabelText("Talk") as HTMLInputElement).value).toBe("  ");
  expect(fetcher).not.toHaveBeenCalled();
});
it("sends normalized numeric input, confirms only persisted 201 and resets", async () => {
  const saved = vi.fn();
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1, talkId: "Engineering bots", author: "Ana", comment: "Useful workshop", rating: 5, createdAt: new Date().toISOString() }), { status: 201 }));
  vi.stubGlobal("fetch", fetcher);
  render(<FeedbackForm onSaved={saved} />); fill();
  fireEvent.click(screen.getByRole("button", { name: /Send feedback/ }));
  expect(await screen.findByText(/Feedback saved/)).toBeTruthy();
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ talkId: "Engineering bots", author: "Ana", comment: "Useful workshop", rating: 5 });
  expect((screen.getByLabelText("Talk") as HTMLInputElement).value).toBe("");
  expect(saved).toHaveBeenCalledOnce();
});
it("retains values and server field errors on rejection", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ errors: { comment: "comment must be at most 1000 characters" } }), { status: 400 })));
  render(<FeedbackForm onSaved={() => {}} />); fill();
  fireEvent.click(screen.getByRole("button", { name: /Send feedback/ }));
  expect(await screen.findByText("comment must be at most 1000 characters")).toBeTruthy();
  expect((screen.getByLabelText("Your name") as HTMLInputElement).value).toBe("  Ana  ");
  expect(screen.queryByText(/Feedback saved/)).toBeNull();
});
it.each([500, 200])("never confirms an unexpected response (%s)", async (status) => {
  const saved = vi.fn(); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status })));
  render(<FeedbackForm onSaved={saved} />); fill();
  fireEvent.click(screen.getByRole("button", { name: /Send feedback/ }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("could not save"));
  expect(saved).not.toHaveBeenCalled();
  expect((screen.getByLabelText("Talk") as HTMLInputElement).value).toContain("Engineering bots");
});
it("blocks duplicate submissions while saving", async () => {
  vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
  render(<FeedbackForm onSaved={() => {}} />); fill();
  fireEvent.click(screen.getByRole("button", { name: /Send feedback/ }));
  expect((await screen.findByRole("button", { name: /Saving/ }) as HTMLButtonElement).disabled).toBe(true);
});
