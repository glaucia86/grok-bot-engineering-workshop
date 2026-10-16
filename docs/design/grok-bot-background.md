# Supplied Grok Bot portraits

This addition preserves the approved three-page UI and green/neutral palette. Five supplied characters decorate the existing loop illustration. The black Grok Bot is the larger central protagonist on the home page; the other four characters remain static. Feedback and results have faint, entirely static background portraits behind their working surfaces. The proposed navy/orange palette was not applied.

## Asset inspection

All six user attachments were materialized and visually inspected. The five role screenshots identify FDE TypeScript (green), QA bot (pink), Engineering Lead (red), DevOps / SRE (purple), and Grok Bot (black). The remaining file is a 400px black/white application icon and is not used as another character. The mentioned GIF has not been received.

The PNGs in `mvp/public/bots` preserve the supplied bytes. CSS selects an 80px avatar region from each screenshot so application labels/tabs are not displayed. The source is not asserted to be a transparent cutout. No replacement artwork, GIF frames, or inferred roles were generated. The home black bot has two authored CSS eyelid overlays, measured against its existing white eye capsules. The PNG and body are unchanged; the other characters retain their original eyes. Source hashes and crop rectangles are recorded in [the asset manifest](evidence/bots/assets.json).

## Reference observation

- [agentes.chat](https://agentes.chat/): inspected in a real browser at 1440px before and after pointer movement. It presents a rendered canvas character and smaller floating characters around a hero. This inspired the bounded decorative scene; no code or branding was copied. Observed canvas image changes are not a claim about its internal implementation.
- [Official Grok Bot](https://x.ai/bot): its public page content was inspected with the web reader. The browser returned a Cloudflare verification page (403), so live animation on this reference was not observed. No challenge or protection was bypassed. The supplied screenshots are the actual visual source for this implementation.

## Motion contract

`BotBackdrop` uses refs and direct transforms. Pointer input updates target coordinates; one requestAnimationFrame loop eases only the home black protagonist toward them and stops after settling. Each axis is bounded to 12px, with an opt-in rotation bounded to 3 degrees. Supporting characters and every working-page portrait never opt into pointer tracking. No React state changes occur for pointermove. No click/pointerdown handler or pointer capture is installed.

The complete decorative layer is aria-hidden and pointer-events none. It does not add a tab stop. Motion only runs with no reduced-motion preference, a fine primary pointer, and hover support; touch/pen events are ignored. Reduced motion and touch retain five static portraits. Runtime preference changes, hidden documents, unmount, blur and pointer exit cancel/reset or settle the effect as appropriate. Only the home black portrait translates and tilts. Its two local eyelids close for 140ms after irregular 4–8 second pauses. The body never scales. Blink timers stop and the eyes open when hidden, on preference changes, and on cleanup; touch/reduced motion stays open and static. Supporting characters do not blink: their small screenshots are left intact rather than guessing at eye masks.

## Validation

TDD verified a missing-component RED, 13 passing motion unit tests, seven blink-timing tests and three portrait-composition tests for frame deduplication, bounds, cleanup, preferences and no child rerenders, and four browser REDs before the portraits were connected. Connected browser checks passed for local assets, decorative semantics, bounds, runtime reduced motion, initial reduced motion, touch and navigation through the unchanged controls. The full local suite passed 157 unit/API/PGlite tests and 47 Chromium tests, plus four loopback HTTP checks. No remote Neon write was made.

Actual desktop, pointer-left/right, reduced-motion and mobile captures are retained under [evidence/bots](evidence/bots). Browser captures are local rendering evidence; Preview readiness and the application persistence journey are separate claims. Independent review and exact-head CI results are recorded in the PR.
