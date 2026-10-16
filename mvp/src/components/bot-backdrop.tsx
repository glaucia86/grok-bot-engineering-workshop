"use client";

import { useEffect, useRef, type ReactNode } from "react";

const MOTION_QUERY = "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)";
const MAX_OFFSET = 12;
const MAX_TILT = 3;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Decorative sprites opt into bounded pointer motion with data-bot-depth="0…1".
 * Optional data-bot-tilt="0…1" adds up to three degrees of gentle rotation.
 * A stationary data-bot ancestor supplies the center for each character.
 */
export function BotBackdrop({ children, className = "" }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current || typeof window.matchMedia !== "function") return;

    const media = window.matchMedia(MOTION_QUERY);
    const bots = [...root.current.querySelectorAll<HTMLElement>("[data-bot-depth]")].map((element) => {
      const depth = Number(element.dataset.botDepth);
      const tilt = Number(element.dataset.botTilt);
      return {
        element,
        anchor: element.closest<HTMLElement>("[data-bot]"),
        x: 0, y: 0, targetX: 0, targetY: 0,
        depth: Number.isFinite(depth) ? clamp(depth, 0, 1) : 1,
        tilt: Number.isFinite(tilt) ? clamp(tilt, 0, 1) : 0,
      };
    });
    let frame: number | null = null;
    let listening = false;

    const reset = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      for (const bot of bots) {
        bot.x = bot.y = bot.targetX = bot.targetY = 0;
        bot.element.style.removeProperty("transform");
      }
    };

    const animate = () => {
      frame = null;
      let settled = true;
      for (const bot of bots) {
        bot.x += (bot.targetX - bot.x) * 0.14;
        bot.y += (bot.targetY - bot.y) * 0.14;
        const done = Math.abs(bot.targetX - bot.x) < 0.01 && Math.abs(bot.targetY - bot.y) < 0.01;
        if (done) { bot.x = bot.targetX; bot.y = bot.targetY; }
        else settled = false;
        const { element, depth, tilt, x, y } = bot;
        const rotation = tilt ? ` rotate(${(x / MAX_OFFSET) * MAX_TILT * tilt}deg)` : "";
        element.style.transform = `translate3d(${x * depth}px, ${y * depth}px, 0)${rotation}`;
      }
      if (!settled) frame = window.requestAnimationFrame(animate);
    };
    const schedule = () => {
      if (frame === null && bots.length) frame = window.requestAnimationFrame(animate);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || document.hidden) return;
      // Stationary anchors avoid feeding the animated body transform back into
      // the next gaze calculation. Read each character's rectangle only once.
      const rectangles = new Map<HTMLElement, DOMRect>();
      for (const bot of bots) {
        if (bot.anchor && !rectangles.has(bot.anchor)) rectangles.set(bot.anchor, bot.anchor.getBoundingClientRect());
        const rect = bot.anchor ? rectangles.get(bot.anchor) : undefined;
        bot.targetX = clamp(rect ? (event.clientX - rect.left - rect.width / 2) / Math.max(160, rect.width * 1.5) : event.clientX / Math.max(window.innerWidth, 1) * 2 - 1, -1, 1) * MAX_OFFSET;
        bot.targetY = clamp(rect ? (event.clientY - rect.top - rect.height / 2) / Math.max(160, rect.height * 1.5) : event.clientY / Math.max(window.innerHeight, 1) * 2 - 1, -1, 1) * MAX_OFFSET;
      }
      schedule();
    };
    const neutral = () => {
      for (const bot of bots) bot.targetX = bot.targetY = 0;
      if (bots.some(bot => bot.x || bot.y) || frame !== null) schedule();
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
