// @vitest-environment happy-dom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TalkResults } from "./feedback-dashboard";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it.each(["First talk", "Second talk"])("returns focus and instantly centers the explorer when selecting %s", talkId => {
  render(<TalkResults talks={[
    { talkId: "First talk", average: 4, count: 2 },
    { talkId: "Second talk", average: 5, count: 1 },
  ]} />);
  const explorer = screen.getByLabelText("Explore a talk") as HTMLSelectElement;
  // Happy DOM does not perform layout. Observe the native scrolling boundary;
  // the existing mobile Playwright test verifies the actual viewport geometry.
  const focus = vi.spyOn(explorer, "focus");
  const scroll = vi.spyOn(explorer, "scrollIntoView");
  fireEvent.click(screen.getByRole("button", { name: talkId }));
  expect(document.activeElement).toBe(explorer);
  expect(explorer.value).toBe(talkId);
  expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  expect(scroll).toHaveBeenCalledWith({ behavior: "instant", block: "center" });
  expect(screen.getByRole("button", { name: talkId }).getAttribute("aria-pressed")).toBe("true");
});
