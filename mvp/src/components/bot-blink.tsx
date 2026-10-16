"use client";

import { useEffect, useRef, type ReactNode } from "react";

const MOTION_QUERY = "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)";

/** Drives an authored eye overlay; CSS decides how open and closed eyes look. */
export function BotBlink({ children }: { children: ReactNode }) {
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(MOTION_QUERY);
    let timer: number | null = null;

    const stop = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
      element.dataset.blink = "open";
    };
    const schedule = () => {
      timer = window.setTimeout(() => {
        timer = null;
        if (!media.matches || document.hidden) return;
        element.dataset.blink = "closed";
        timer = window.setTimeout(() => {
          timer = null;
          element.dataset.blink = "open";
          if (media.matches && !document.hidden) schedule();
        }, 140);
      }, 4000 + Math.random() * 4000);
    };
    const sync = () => {
      stop();
      if (media.matches && !document.hidden) schedule();
    };

    media.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      media.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      stop();
    };
  }, []);

  return <span ref={root} className="bot-blink" aria-hidden="true" data-blink="open">{children}</span>;
}
