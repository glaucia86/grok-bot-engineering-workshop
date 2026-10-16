# Workshop workspace direction (#35)

Baseline: main c69fa31ecccc85b5d8b9023b72568d319f2e2995 at http://127.0.0.1:3187. Real local production build; five-talk intercepted GET fixture, no remote persistence. Screenshots/Playwright trace and resource/long-task/CLS measurements are in visual-shell-evidence/baseline outside this checkout.

Observed: first input top580px at390x844 and679px at1440x900. No page overflow in captured views. The promotional intro consumes space, mobile hides Leave feedback navigation, ornamental numbering/italic aside mix visual languages, and narrow chart requires scrolling. #37 owns data layout.

Design read: a compact engineering workshop workspace for attendees who need to submit a rating and inspect results. The dominant move is a short identity band above two clearly bounded working surfaces; no marketing hero or decorative animation.

## Composition before implementation (layout specification, not a running-app capture)

Desktop1440: content max1264, margins48+, header72 with product left/existing anchor links right; intro24px vertical, title32; gap24; form roughly44%/results56%, white panels24px inset. Both panel headings and first field occupy the upper400px. Footer follows work, no fixed overlays.

Mobile390: margins16; header wraps deliberately with44px link targets; intro16px; title28; single column with20px panel inset and24px gap. Feedback first, results second. At320, nav can use its own row. Full names wrap, no page-level clipping. Existing product name, anchor IDs, navigation labels and landmarks retained.

## Tokens and packages

System Segoe UI/Helvetica Neue/Arial (no font download), ink#172126, muted#53616a, canvas#f5f6f8, surface#fff, accent#16604f, border#cbd2d7, error#a52c22. Type14/16/24/32 with readable1.5line-height; spacing8/12/16/24/32; control radius6 and panel radius12. Focus outline2px accent with4px offset. Smalltext uses muted or ink, never border color.

Shared motion: control160ms, state240ms, cubic-bezier(.2,.7,.2,1). Color/opacity only at shell controls; no layout dimension animation or page entrances. Reduced motion0ms, no transforms, smooth scroll, pulse/shimmer or interpolation. Form/dashboard use these shared tokens in #36/#37.

Inspected installed lockfile/packages: Next16.4.1, React19.3, Tailwind4, Base UI1.9, lucide1.57, Recharts3.8, tw-animate-css1.4. No new package: CSS covers shell feedback; existing native controls/icons suffice. No animation subsystem, license or maintenance addition. Actual browser and production asset comparison follows implementation using the same local build/device/five-talk fixture. Cold JS initialization long tasks must not be attributed to motion without evidence.

Tools actually used: repository inspection, bundled Next CSS guidance, local Playwright Chromium production app, screenshot inspection and traces. OpenDesign was unavailable and was not installed/executed. Design-taste-frontend audit principles applied to shell only; dashboard remains data-focused. No image generation, stock references or third-party template used.

Acceptance limits: fixtures prove rendering and interaction, never deployed SHA/database binding/persistence. #16 authorized isolated preview remains blocked externally. Checkpoint, slides/guide and APIs unchanged.

## Verified result

[Before/after screenshots and measurements](evidence/35) are actual local app renders with the same five-talk fixture. 390/768/1440 first-input tops: baseline580/646/679px; redesigned396/385/394px. No page horizontal overflow; CLS0 in every run. At320px, the navigation uses a separate row and the first field remains within the viewport. Existing chart-only scrolling remains #37 scope.

All production .next/static JS/CSS totals (same route set): baseline1,133,761bytes /340,781gzip; redesigned1,134,092 /340,834gzip, delta+331/+53. No added runtime package. Per-run browser metrics show baseline3/1/1 long tasks versus after0/0/0 over50ms. These sequential local unthrottled samples are not a controlled performance improvement claim. The change adds no JS motion loop or layout-dimension animation; no motion-attributable long task or shift was observed. Traces retain actual local fixture activity only.

Repeat from mvp after npmci +npmrunbuild, with local Chromium installed: `node scripts/capture-shell.mjs after <output-directory>`. It launches loopback3187 with DATABASE_URL explicitly empty, intercepts API GETs, records all three viewports, Playwright trace, longtasks/CLS/resource timings and production asset/gzip sizes, then closes the browser/server. Set CAPTURE_SHA to the inspected revision; PLAYWRIGHT_BROWSERS_PATH may point to a workspace-owned browser install. Sameviewport/data/device profile is documented in browser-metrics.json. Run the baseline revision separately with the same helper and profile; never compare a developer server with a production build.

Validation:118Vitest,8existing local browser scenarios and2new normal/reduced shell scenarios pass. New tests cover320/390/768/1440,200%CSSzoom, visible nav, keyboard skip/anchor activation and160ms/0ms computed transitions. Lint0errors(1existing radio warning),types,productionbuild,HTTP3/3 passed. The new compact-placement tests failed before implementation. One JSX apostrophe was escaped; generated Playwright reports were moved outside the source checkout before lint. Independent reviewer inspected all six screenshots and source, no findings. CSSzoom is an explicit layout test; it does not claim a native browser UI zoom measurement.

Contrast ratios (sRGB calculation): ink#172126,muted#53616a and accent#16604f on white or canvas exceed4.5:1 for normal text; white on accent exceeds4.5:1. Input boundary#87959e on white exceeds3:1. Focus uses2px accent outlines and4px offsets. Placeholder retains existing#70786d onwhite (exceeds4.5:1). UI-state colors supplement text/semantics.
