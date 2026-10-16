"use client";

import { useEffect, useRef, type ReactNode } from "react";

const MOTION_QUERY = "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)";
const MAX_OFFSET = 12;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Decorative sprites opt into bounded pointer motion with data-bot-depth="0…1".
 * Keep positioning/cropping on nested elements: this wrapper owns their transform.
 */
export function BotBackdrop({ children, className = "" }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current || typeof window.matchMedia !== "function") return;

    const media = window.matchMedia(MOTION_QUERY);
    const bots = [...root.current.querySelectorAll<HTMLElement>("[data-bot-depth]")].map((element) => {
      const depth = Number(element.dataset.botDepth);
      return { element, depth: Number.isFinite(depth) ? clamp(depth, 0, 1) : 1 };
    });
    let frame: number | null = null;
    let listening = false;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;

    const reset = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      x = y = targetX = targetY = 0;
      for (const { element } of bots) element.style.removeProperty("transform");
    };

    const animate = () => {
      frame = null;
      x += (targetX - x) * 0.14;
      y += (targetY - y) * 0.14;
      const settled = Math.abs(targetX - x) < 0.01 && Math.abs(targetY - y) < 0.01;
      if (settled) { x = targetX; y = targetY; }
      for (const { element, depth } of bots) {
        element.style.transform = `translate3d(${x * depth}px, ${y * depth}px, 0)`;
      }
      if (!settled) frame = window.requestAnimationFrame(animate);
    };
    const schedule = () => {
      if (frame === null && bots.length) frame = window.requestAnimationFrame(animate);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || document.hidden) return;
      targetX = clamp((event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1, -1, 1) * MAX_OFFSET;
      targetY = clamp((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1, -1, 1) * MAX_OFFSET;
      schedule();
    };
    const neutral = () => {
      targetX = targetY = 0;
      if (x || y || frame !== null) schedule();
    };
    const visibility = () => { if (document.hidden) reset(); };
    const detach = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("mouseleave", neutral);
      window.removeEventListener("blur", neutral);
      document.removeEventListener("visibilitychange", visibility);
      listening = false;
      reset();
    };
    const syncPreference = () => {
      if (!media.matches) { detach(); return; }
      if (listening || !bots.length) return;
      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("mouseleave", neutral);
      window.addEventListener("blur", neutral);
      document.addEventListener("visibilitychange", visibility);
      listening = true;
    };

    media.addEventListener("change", syncPreference);
    syncPreference();
    return () => {
      media.removeEventListener("change", syncPreference);
      detach();
    };
  }, [children]);

  return <div ref={root} className={`bot-backdrop ${className}`.trim()} aria-hidden="true" style={{ pointerEvents: "none" }}>{children}</div>;
}
