// @vitest-environment happy-dom
import React from "react";
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { FeedbackForm } from "./feedback-form";
import { FeedbackPage } from "./feedback-page";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function fill() {
  fireEvent.change(screen.getByLabelText("Talk"), { target: { value: "  Engineering bots  " } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "  Ana  " } });
  fireEvent.change(screen.getByLabelText("Comment (optional)"), { target: { value: "  Useful workshop  " } });
  fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));
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

it("previews pointer stars without committing and restores the selected rating on leave", () => {
  render(<FeedbackForm onSaved={() => {}} />);
  fireEvent.click(screen.getByRole("radio", { name: "2 stars" }));
  const fifth = screen.getByRole("radio", { name: "5 stars" });
  fireEvent.pointerEnter(fifth.closest("label")!);
  expect(screen.getByText("Preview: 5 of 5 stars")).toBeTruthy();
  expect((screen.getByRole("radio", { name: "2 stars" }) as HTMLInputElement).checked).toBe(true);
  expect((fifth as HTMLInputElement).checked).toBe(false);
  fireEvent.pointerLeave(fifth.closest(".rating-options")!);
  expect(screen.queryByText("Preview: 5 of 5 stars")).toBeNull();
  expect(screen.getByText("2 of 5 stars selected")).toBeTruthy();
});

it.each([true, false])("clears a hovered star preview when submitting from another field (rating committed: %s)", async (hasRating) => {
  const fetcher = vi.fn<typeof fetch>(() => new Promise(() => {}));
  vi.stubGlobal("fetch", fetcher);
  render(<FeedbackForm onSaved={() => {}} />);
  fireEvent.change(screen.getByLabelText("Talk"), { target: { value: "Engineering bots" } });
  const author = screen.getByLabelText("Your name");
  fireEvent.change(author, { target: { value: "Ana" } });
  if (hasRating) fireEvent.click(screen.getByRole("radio", { name: "2 stars" }));
  fireEvent.pointerEnter(screen.getByRole("radio", { name: "5 stars" }).closest("label")!);
  expect(screen.getByText("Preview: 5 of 5 stars")).toBeTruthy();
  author.focus();
  fireEvent.keyDown(author, { key: "Enter" });
  fireEvent.submit(author.closest("form")!);
  expect(screen.queryByText("Preview: 5 of 5 stars")).toBeNull();
  expect(document.querySelectorAll('.rating-option svg[fill="currentColor"]')).toHaveLength(hasRating ? 2 : 0);
  if (hasRating) {
    expect(screen.getByText("2 of 5 stars selected")).toBeTruthy();
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body)).rating).toBe(2);
    expect((screen.getByRole("button", { name: /Saving/ }) as HTMLButtonElement).disabled).toBe(true);
  } else {
    expect(screen.getByText("No rating selected")).toBeTruthy();
    expect(screen.getByText("rating must be a number")).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("radio", { name: "1 star" })));
    expect(fetcher).not.toHaveBeenCalled();
  }
});

it("offers retry with retained input, blocks rapid retries and keeps confirmation while editing", async () => {
  let resolveSave!: (response: Response) => void;
  const fetcher = vi.fn().mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))
    .mockImplementationOnce(() => new Promise<Response>((resolve) => { resolveSave = resolve; }));
  vi.stubGlobal("fetch", fetcher);
  render(<FeedbackForm onSaved={() => {}} />); fill();
  fireEvent.click(screen.getByRole("button", { name: /Send feedback/ }));
  const retry = await screen.findByRole("button", { name: /Try again/ });
  expect((screen.getByLabelText("Comment (optional)") as HTMLTextAreaElement).value).toBe("  Useful workshop  ");
  expect((screen.getByRole("radio", { name: "5 stars" }) as HTMLInputElement).checked).toBe(true);
  fireEvent.click(retry);
  const form = retry.closest("form")!;
  fireEvent.submit(form); fireEvent.submit(form);
  expect(fetcher).toHaveBeenCalledTimes(2);
  resolveSave(new Response(JSON.stringify({ id: 1, talkId: "Engineering bots", author: "Ana", comment: "Useful workshop", rating: 5, createdAt: "2026-01-01T00:00:00.000Z" }), { status: 201 }));
  expect(await screen.findByRole("link", { name: "View results" })).toHaveProperty("hash", "#results");
  fireEvent.change(screen.getByLabelText("Talk"), { target: { value: "Another talk" } });
  expect(screen.getByText(/Feedback saved/)).toBeTruthy();
});

it("labels optional comments and exposes five required native star radios", () => {
  render(<FeedbackForm onSaved={() => {}} />);
  expect(screen.getByText("Talk, your name and a rating are required. Comments are optional.")).toBeTruthy();
  expect(screen.queryByText("All fields are required.")).toBeNull();
  expect((screen.getByLabelText("Comment (optional)") as HTMLTextAreaElement).required).toBe(false);
  expect(screen.getAllByRole("radio")).toHaveLength(5);
  for (const rating of [1, 2, 3, 4, 5]) {
    const radio = screen.getByRole("radio", { name: rating === 1 ? "1 star" : `${rating} stars` }) as HTMLInputElement;
    expect(radio.type).toBe("radio");
    expect(radio.required).toBe(true);
    expect(radio.checked).toBe(false);
  }
  expect(screen.getByText("No rating selected")).toBeTruthy();
  fireEvent.click(screen.getByRole("radio", { name: "3 stars" }));
  expect(screen.getByText("3 of 5 stars selected")).toBeTruthy();
  expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(1);
});

it.each([1, 2, 3, 4, 5])("submits a %s-star rating with an empty comment and resets", async (rating) => {
  const saved = vi.fn();
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    id: 2, talkId: "Engineering bots", author: "Ana", comment: "", rating, createdAt: "2026-01-01T00:00:00.000Z",
  }), { status: 201 }));
  vi.stubGlobal("fetch", fetcher);
  render(<FeedbackForm onSaved={saved} />);
  fireEvent.change(screen.getByLabelText("Talk"), { target: { value: "  Engineering bots  " } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "  Ana  " } });
  fireEvent.click(screen.getByRole("radio", { name: rating === 1 ? "1 star" : `${rating} stars` }));
  fireEvent.click(screen.getByRole("button", { name: /Send feedback/ }));
  expect(await screen.findByText(/Feedback saved/)).toBeTruthy();
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ talkId: "Engineering bots", author: "Ana", comment: "", rating });
  expect(saved).toHaveBeenCalledOnce();
  expect(screen.getAllByRole("radio").every((input) => !(input as HTMLInputElement).checked)).toBe(true);
  expect(screen.getByText("No rating selected")).toBeTruthy();
});

it("normalizes a whitespace-only comment before sending", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    id: 3, talkId: "Engineering bots", author: "Ana", comment: "", rating: 5, createdAt: "2026-01-01T00:00:00.000Z",
  }), { status: 201 }));
  vi.stubGlobal("fetch", fetcher);
  render(<FeedbackForm onSaved={() => {}} />); fill();
  fireEvent.change(screen.getByLabelText("Comment (optional)"), { target: { value: " \t\n " } });
  fireEvent.click(screen.getByRole("button", { name: /Send feedback/ }));
  expect(await screen.findByText(/Feedback saved/)).toBeTruthy();
  expect(JSON.parse(fetcher.mock.calls[0][1].body).comment).toBe("");
});

it("requires a rating even when the optional comment is empty", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  render(<FeedbackForm onSaved={() => {}} />);
  fireEvent.change(screen.getByLabelText("Talk"), { target: { value: "Engineering bots" } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Ana" } });
  fireEvent.click(screen.getByRole("button", { name: /Send feedback/ }));
  expect(await screen.findByText("rating must be a number")).toBeTruthy();
  const firstStar = screen.getByRole("radio", { name: "1 star" });
  expect(firstStar.getAttribute("aria-invalid")).toBe("true");
  expect(firstStar.getAttribute("aria-describedby")).toContain("rating-error");
  await waitFor(() => expect(document.activeElement).toBe(firstStar));
  expect(screen.queryByText("comment is required")).toBeNull();
  expect(fetcher).not.toHaveBeenCalled();
});

it("rejects an overlong comment without sending and accepts 1000 trimmed characters", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    id: 4, talkId: "Engineering bots", author: "Ana", comment: "x".repeat(1000), rating: 5, createdAt: "2026-01-01T00:00:00.000Z",
  }), { status: 201 }));
  vi.stubGlobal("fetch", fetcher);
  render(<FeedbackForm onSaved={() => {}} />); fill();
  const comment = screen.getByLabelText("Comment (optional)") as HTMLTextAreaElement;
  fireEvent.change(comment, { target: { value: `  ${"x".repeat(1001)}  ` } });
  fireEvent.click(screen.getByRole("button", { name: /Send feedback/ }));
  expect(await screen.findByText("comment must be at most 1000 characters")).toBeTruthy();
  expect(comment.value).toBe(`  ${"x".repeat(1001)}  `);
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.change(comment, { target: { value: `  ${"x".repeat(1000)}  ` } });
  fireEvent.click(screen.getByRole("button", { name: /Send feedback/ }));
  expect(await screen.findByText(/Feedback saved/)).toBeTruthy();
  expect(JSON.parse(fetcher.mock.calls[0][1].body).comment).toBe("x".repeat(1000));
});


it("gives the focused form an accessible name and explains required name visibility", () => {
  render(<FeedbackForm onSaved={() => {}} />);
  const form = screen.getByRole("form", { name: "How was the talk?" });
  expect(form.getAttribute("aria-describedby")).toBe("feedback-requirements");
  expect(screen.getByLabelText("Talk").getAttribute("aria-describedby")).toBe("talkId-hint");
  const author = screen.getByLabelText("Your name");
  expect(author.getAttribute("autocomplete")).toBe("name");
  expect(author.getAttribute("aria-describedby")).toBe("author-hint");
  expect(document.getElementById("author-hint")?.textContent).toBe("Your name is required, but it won’t be shown in results.");
  expect(Array.from(form.querySelectorAll("input, textarea")).map((field) => field.getAttribute("name"))).toEqual([
    "talkId", "author", "rating", "rating", "rating", "rating", "rating", "comment",
  ]);
});

it("keeps field guidance associated when validation errors are added", async () => {
  vi.stubGlobal("fetch", vi.fn());
  render(<FeedbackForm onSaved={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: /Send feedback/ }));
  expect(await screen.findByText("author is required")).toBeTruthy();
  expect(screen.getByLabelText("Your name").getAttribute("aria-describedby")).toBe("author-hint author-error");
  expect(screen.getByLabelText("Talk").getAttribute("aria-describedby")).toBe("talkId-hint talkId-error");
  expect(document.querySelectorAll('.rating-selection[aria-live="polite"]')).toHaveLength(1);
  expect(document.querySelector(".rating-preview")?.getAttribute("aria-hidden")).toBe("true");
});

it("gives the feedback route a named guidance panel with specific review prompts", () => {
  render(<FeedbackPage />);
  expect(screen.getByRole("heading", { name: "Leave feedback", level: 1 })).toBeTruthy();
  const guidance = screen.getByRole("complementary", { name: "Make your feedback count" });
  expect(guidance.querySelectorAll("ol > li")).toHaveLength(3);
  expect(guidance.textContent).toContain("Be specific");
  expect(guidance.textContent).toContain("Keep it constructive");
  expect(guidance.textContent).toContain("Share what helped");
  expect(guidance.textContent).toContain("Names are not shown in results.");
  expect(guidance.textContent).not.toMatch(/anonymous/i);
});

it("focuses the first invalid field in visual order when rating and comment both fail", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  render(<FeedbackForm onSaved={() => {}} />);
  fireEvent.change(screen.getByLabelText("Talk"), { target: { value: "Long input test" } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Fixture attendee" } });
  fireEvent.change(screen.getByLabelText("Comment (optional)"), { target: { value: "x".repeat(1001) } });
  fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
  expect(await screen.findByText("comment must be at most 1000 characters")).toBeTruthy();
  expect(screen.getByText("rating must be a number")).toBeTruthy();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("radio", { name: "1 star" })));
  expect(fetcher).not.toHaveBeenCalled();
});


it("keeps visible input, textarea and star boundaries above 3 to 1 contrast", () => {
  const styles = readFileSync("src/components/feedback-form.css", "utf8");
  render(<><style>{styles}</style><FeedbackForm onSaved={() => {}} /></>);
  const luminance = (color: string) => {
    const hex = color.startsWith("#") ? color.slice(1) : undefined;
    const expandedHex = hex?.length === 3 ? hex.split("").map(channel => channel + channel).join("") : hex;
    const rgb = expandedHex
      ? [0, 2, 4].map(offset => Number.parseInt(expandedHex.slice(offset, offset + 2), 16))
      : color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    const channels = rgb.map(value => {
      const channel = value / 255;
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    });
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  };
  const surface = luminance(getComputedStyle(document.querySelector(".feedback-panel")!).backgroundColor);
  const controls = document.querySelectorAll('.form-field input, .form-field textarea, .rating-option > span');
  expect(controls).toHaveLength(8);
  for (const control of controls) {
    const border = luminance(getComputedStyle(control).borderTopColor);
    const contrast = (Math.max(border, surface) + .05) / (Math.min(border, surface) + .05);
    expect(contrast, `${control.getAttribute("name") ?? "rating star"} boundary contrast`).toBeGreaterThanOrEqual(3);
  }
});
