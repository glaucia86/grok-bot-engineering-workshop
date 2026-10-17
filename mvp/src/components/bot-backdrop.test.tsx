// @vitest-environment happy-dom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { BotBackdrop } from "./bot-backdrop";

let media: MediaQueryList;
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let requestFrame: ReturnType<typeof vi.fn>;

beforeEach(() => {
  media = Object.assign(new EventTarget(), { matches: true, media: "", onchange: null }) as MediaQueryList;
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  frames = new Map();
  nextFrame = 0;
  requestFrame = vi.fn((callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.stubGlobal("requestAnimationFrame", requestFrame);
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frames.delete(id)));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function pointer(pointerType = "mouse", clientX = window.innerWidth, clientY = window.innerHeight) {
  fireEvent(window, new PointerEvent("pointermove", { pointerType, clientX, clientY }));
}
function tick() {
  const current = [...frames.values()];
  frames.clear();
  act(() => current.forEach((callback) => callback(performance.now())));
}
function settle() {
  for (let i = 0; frames.size && i < 150; i++) tick();
  expect(frames.size).toBe(0);
}
function fixture() {
  return render(<BotBackdrop className="scene"><div data-bot-depth="1" /><div data-bot-depth="0.5" /></BotBackdrop>);
}
function transforms(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>("[data-bot-depth]")].map((bot) => bot.style.transform);
}

it("renders decoration hidden from assistive technology and unable to intercept controls", () => {
  const { container } = fixture();
  const backdrop = container.firstElementChild as HTMLElement;
  expect(backdrop.getAttribute("aria-hidden")).toBe("true");
  expect(backdrop.classList.contains("bot-backdrop")).toBe(true);
  expect(backdrop.classList.contains("scene")).toBe(true);
  expect(backdrop.style.pointerEvents).toBe("none");
  expect(requestFrame).not.toHaveBeenCalled();
});

it("coalesces pointer bursts into one frame, moves softly by depth, and stops when settled", () => {
  const { container } = fixture();
  pointer(); pointer(); pointer();
  expect(frames.size).toBe(1);
  expect(transforms(container)).toEqual(["", ""]);
  tick();
  const first = transforms(container);
  expect(first[0]).toMatch(/^translate3d\(/);
  expect(first[0]).not.toEqual(first[1]);
  settle();
  expect(transforms(container)).toEqual(["translate3d(12px, 12px, 0)", "translate3d(6px, 6px, 0)"]);
});

it("clamps out-of-window positions and invalid depths to the motion budget", () => {
  const { container } = render(<BotBackdrop><div data-bot-depth="5" /><div data-bot-depth="invalid" /></BotBackdrop>);
  pointer("mouse", window.innerWidth * 8, -9999);
  settle();
  expect(transforms(container)).toEqual(["translate3d(12px, -12px, 0)", "translate3d(12px, -12px, 0)"]);
});

it("adds opt-in gentle tilt, bounds its angle, and resets it with the pointer", () => {
  const { container } = render(<BotBackdrop><div data-bot-depth="1" data-bot-tilt="9" /><div data-bot-depth="1" data-bot-tilt="0.5" /></BotBackdrop>);
  pointer("mouse", window.innerWidth * 8, window.innerHeight);
  settle();
  expect(transforms(container)).toEqual([
    "translate3d(12px, 12px, 0) rotate(3deg)",
    "translate3d(12px, 12px, 0) rotate(1.5deg)",
  ]);
  pointer("mouse", -9999, 0);
  settle();
  expect(transforms(container)[0]).toBe("translate3d(-12px, -12px, 0) rotate(-3deg)");
  fireEvent(window, new Event("mouseleave"));
  settle();
  expect(transforms(container)).toEqual([
    "translate3d(0px, 0px, 0) rotate(0deg)",
    "translate3d(0px, 0px, 0) rotate(0deg)",
  ]);
  pointer(); tick();
  act(() => { Object.assign(media, { matches: false }); media.dispatchEvent(new Event("change")); });
  expect(transforms(container)).toEqual(["", ""]);
  expect(frames.size).toBe(0);
});

it("ignores touch and pen input even on a mouse-capable device", () => {
  const { container } = fixture();
  pointer("touch"); pointer("pen");
  expect(frames.size).toBe(0);
  expect(transforms(container)).toEqual(["", ""]);
});

it("keeps coarse pointers and reduced-motion preferences static without pointer listeners", () => {
  Object.assign(media, { matches: false });
  const add = vi.spyOn(window, "addEventListener");
  fixture(); pointer();
  expect(window.matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)");
  expect(add.mock.calls.some(([name]) => name === "pointermove")).toBe(false);
  expect(frames.size).toBe(0);
});

it("responds to preference changes, cancels motion, and can enable again", () => {
  const { container } = fixture();
  pointer(); tick();
  act(() => { Object.assign(media, { matches: false }); media.dispatchEvent(new Event("change")); });
  expect(frames.size).toBe(0);
  expect(transforms(container)).toEqual(["", ""]);
  pointer(); expect(frames.size).toBe(0);
  act(() => { Object.assign(media, { matches: true }); media.dispatchEvent(new Event("change")); });
  pointer(); expect(frames.size).toBe(1);
});

it.each(["mouseleave", "blur"])("returns to neutral on %s and stops", (event) => {
  const { container } = fixture();
  pointer(); settle();
  fireEvent(window, new Event(event));
  settle();
  expect(transforms(container)).toEqual(["translate3d(0px, 0px, 0)", "translate3d(0px, 0px, 0)"]);
});

it("cancels frames while hidden and resumes only from new input", () => {
  const { container } = fixture();
  pointer(); tick();
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  fireEvent(document, new Event("visibilitychange"));
  expect(frames.size).toBe(0);
  expect(transforms(container)).toEqual(["", ""]);
  pointer(); expect(frames.size).toBe(0);
});

it("cleans up its frame and every listener through remounts", () => {
  const removeWindow = vi.spyOn(window, "removeEventListener");
  const removeDocument = vi.spyOn(document, "removeEventListener");
  const removeMedia = vi.spyOn(media, "removeEventListener");
  const { unmount } = fixture();
  pointer(); unmount();
  expect(frames.size).toBe(0);
  for (const event of ["pointermove", "mouseleave", "blur"]) {
    expect(removeWindow.mock.calls.some(([name]) => name === event)).toBe(true);
  }
  expect(removeDocument).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  expect(removeMedia).toHaveBeenCalledWith("change", expect.any(Function));
  fixture(); pointer();
  expect(frames.size).toBe(1);
});

it("does not rerender children for pointer input", () => {
  const committed = vi.fn();
  render(<React.Profiler id="decoration" onRender={committed}><BotBackdrop><div data-bot-depth="1" /></BotBackdrop></React.Profiler>);
  pointer(); tick(); pointer(); settle();
  expect(committed).toHaveBeenCalledOnce();
});

it("survives Strict Mode effect replay without orphaned frames", () => {
  const { unmount } = render(<React.StrictMode><BotBackdrop><div data-bot-depth="1" /></BotBackdrop></React.StrictMode>);
  pointer();
  expect(frames.size).toBe(1);
  unmount();
  expect(frames.size).toBe(0);
  pointer();
  expect(frames.size).toBe(0);
});

it("aims each face from its own stationary character center", () => {
  const { container } = render(<BotBackdrop><span data-bot="left"><span data-bot-depth="0.75" data-bot-tilt="1"><svg><g className="mascot-face" data-bot-depth="0.65" /></svg></span></span><span data-bot="right"><span data-bot-depth="0.75" data-bot-tilt="1"><svg><g className="mascot-face" data-bot-depth="0.65" /></svg></span></span></BotBackdrop>);
  const bots = container.querySelectorAll<HTMLElement>("[data-bot]");
  vi.spyOn(bots[0], "getBoundingClientRect").mockReturnValue({ left: 0, top: 100, width: 100, height: 100 } as DOMRect);
  vi.spyOn(bots[1], "getBoundingClientRect").mockReturnValue({ left: 400, top: 100, width: 100, height: 100 } as DOMRect);
  pointer("mouse", 250, 150); settle();
  const faces = container.querySelectorAll<SVGElement>(".mascot-face");
  expect(faces[0].style.transform).toMatch(/^translate3d\([1-9]/);
  expect(faces[1].style.transform).toMatch(/^translate3d\(-[1-9]/);
  expect(faces[0].style.transform).toContain(", 0px, 0)");
  expect([...bots].every(bot => bot.style.transform === "")).toBe(true);
  pointer("mouse", 50, 150); settle();
  expect(faces[0].style.transform).toBe("translate3d(0px, 0px, 0)");
});
