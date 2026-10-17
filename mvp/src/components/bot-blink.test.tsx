// @vitest-environment happy-dom
import React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BotBlink } from "./bot-blink";

let media: MediaQueryList;
beforeEach(() => {
  vi.useFakeTimers();
  media = Object.assign(new EventTarget(), { matches: true, media: "", onchange: null }) as MediaQueryList;
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  vi.spyOn(Math, "random").mockReturnValue(0);
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const advance = (milliseconds: number) => act(() => { vi.advanceTimersByTime(milliseconds); });
function fixture() {
  const view = render(<BotBlink><span className="eyes" /></BotBlink>);
  return { ...view, blink: view.container.firstElementChild as HTMLElement };
}

it("keeps the decorative eyes open before the first irregular delay", () => {
  const { blink } = fixture();
  expect(blink.tagName).toBe("SPAN");
  expect(blink.className).toBe("bot-blink");
  expect(blink.getAttribute("aria-hidden")).toBe("true");
  expect(blink.querySelector(".eyes")).not.toBeNull();
  expect(blink.dataset.blink).toBe("open");
  advance(3999);
  expect(blink.dataset.blink).toBe("open");
});

it("closes for 140ms and uses a fresh random delay for the next blink", () => {
  vi.mocked(Math.random).mockReturnValueOnce(0).mockReturnValueOnce(0.75);
  const { blink } = fixture();
  advance(4000);
  expect(blink.dataset.blink).toBe("closed");
  advance(139);
  expect(blink.dataset.blink).toBe("closed");
  advance(1);
  expect(blink.dataset.blink).toBe("open");
  advance(6999);
  expect(blink.dataset.blink).toBe("open");
  advance(1);
  expect(blink.dataset.blink).toBe("closed");
});

it("opens and cancels timers while hidden, then schedules afresh when visible", () => {
  const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  const { blink } = fixture();
  advance(4000);
  expect(blink.dataset.blink).toBe("closed");
  act(() => { hidden.mockReturnValue(true); document.dispatchEvent(new Event("visibilitychange")); });
  expect(blink.dataset.blink).toBe("open");
  expect(vi.getTimerCount()).toBe(0);
  advance(10000);
  act(() => { hidden.mockReturnValue(false); document.dispatchEvent(new Event("visibilitychange")); });
  expect(vi.getTimerCount()).toBe(1);
  advance(3999);
  expect(blink.dataset.blink).toBe("open");
  advance(1);
  expect(blink.dataset.blink).toBe("closed");
});

it("remains static on touch and reduced motion and responds to preference changes", () => {
  Object.assign(media, { matches: false });
  const { blink } = fixture();
  expect(window.matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)");
  expect(vi.getTimerCount()).toBe(0);
  act(() => { Object.assign(media, { matches: true }); media.dispatchEvent(new Event("change")); });
  advance(4000);
  expect(blink.dataset.blink).toBe("closed");
  act(() => { Object.assign(media, { matches: false }); media.dispatchEvent(new Event("change")); });
  expect(blink.dataset.blink).toBe("open");
  expect(vi.getTimerCount()).toBe(0);
});

it("starts with no timer in a hidden document", () => {
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  const { blink } = fixture();
  expect(blink.dataset.blink).toBe("open");
  expect(vi.getTimerCount()).toBe(0);
});

it("cleans up its timer and listeners on unmount", () => {
  const removeMedia = vi.spyOn(media, "removeEventListener");
  const removeDocument = vi.spyOn(document, "removeEventListener");
  const { unmount } = fixture();
  advance(4000);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
  expect(removeMedia).toHaveBeenCalledWith("change", expect.any(Function));
  expect(removeDocument).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  act(() => media.dispatchEvent(new Event("change")));
  expect(vi.getTimerCount()).toBe(0);
});

it("survives Strict Mode replay and blinks without React commits", () => {
  const committed = vi.fn();
  const { unmount } = render(<React.StrictMode><React.Profiler id="blink" onRender={committed}><BotBlink><span /></BotBlink></React.Profiler></React.StrictMode>);
  const initialCommits = committed.mock.calls.length;
  expect(vi.getTimerCount()).toBe(1);
  advance(4140);
  expect(committed).toHaveBeenCalledTimes(initialCommits);
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("staggers five mascots even with the same random sample", () => {
  const { container } = render(<>{[0, 1, 2, 3, 4].map(phase => <BotBlink key={phase} phase={phase}><span /></BotBlink>)}</>);
  advance(4000);
  const blinks = [...container.querySelectorAll<HTMLElement>(".bot-blink")];
  expect(blinks.map(blink => blink.dataset.blink)).toEqual(["closed", "open", "open", "open", "open"]);
  advance(600);
  expect(blinks.map(blink => blink.dataset.blink)).toEqual(["open", "closed", "open", "open", "open"]);
});
