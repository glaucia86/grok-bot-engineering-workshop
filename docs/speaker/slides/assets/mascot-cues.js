/* Finite, decorative cues adapted from Bloub's thinking / wink states.
 * Copyright (c) 2026 Jérémy Perret. MIT; see ../vendor/bloub/LICENSE.
 * Source: https://github.com/jeremy-prt/bloub/blob/main/src/bot/states.ts
 * Adaptation: one pulse per dot, original workshop silhouettes retained.
 */
(function (root) {
  'use strict';
  const clamp = value => Math.max(0, Math.min(1, value));
  // Bloub's cosine pulse, bounded to its first wave rather than looping.
  function dotPulse(time, index) {
    const p = (time - index * .5) / 1.5;
    if (p < 0 || p >= .5) return 0;
    return clamp(2 * (.5 - .5 * Math.cos(p * Math.PI * 2)));
  }
  function sampleCue(kind, elapsed) {
    if (!Number.isFinite(elapsed) || elapsed < 0) return null;
    const time = (elapsed - 450) / 1000;
    if (kind === 'thinking' && time < 2.4) {
      return { kind, opacity: clamp(time / .2) * clamp((2.4 - time) / .3),
        pulses: [0, 1, 2].map(index => dotPulse(time, index)) };
    }
    if (kind === 'wink' && time < 1.1) {
      return { kind, close: clamp(time / .18) * clamp((.95 - time) / .5) };
    }
    return null;
  }
  const api = Object.freeze({ sampleCue });
  root.WorkshopMascotCues = api;
})(typeof window === 'undefined' ? globalThis : window);
