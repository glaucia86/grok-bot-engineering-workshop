# Five native workshop mascots

This refinement starts at `10397bc` and preserves the approved three-page shell,
form and dashboard. All five original vector mascots belong to the home loop:
Grok (black blob), FDE (green square), QA (pink drop), DevOps/SRE (purple drop),
and Engineering Lead (red wedge). The four new paths were authored for this
workshop; no proprietary SVG paths, bundles, raster crops or eye masks are used.

Each stationary character supplies its own rectangle for pointer coordinates.
A nested body layer eases to at most 5.4 CSS pixels of translation and 3 degrees
of tilt; its separate SVG face eases up to 7.8 SVG units. Geometry is measured
once per character per mouse event, never continuously in the animation loop.
One requestAnimationFrame loop coalesces input and stops when settled, without
React state updates. Pointer leave/blur returns to neutral. Hidden tabs cancel
frames and blink timers; unmount removes listeners and timers. Reduced motion
and coarse/touch devices retain static open eyes. Independent random blink
intervals have role-specific phase offsets, with 140ms closed duration.

## Verification and evidence

TDD RED: the new five-character assertions, per-character opposing gaze, and
staggered blink tests failed against the single-mascot baseline before the patch.
GREEN: 158 unit/API/local PGlite tests; 47 Chromium browser tests. Build, types
and localhost HTTP checks pass. Lint has zero errors and the existing unrelated
`aria-invalid` warning on the form's native radio input.

Browser tests move the real cursor in four directions, assert face translation
separately from body tilt, and sample 32 perimeter points on each eye against
its body path. Another check places the cursor between two characters and
verifies opposite horizontal gaze. Clock-controlled tests close each character's
eyes separately while the other four remain open; only authored finite eye CSS
transitions are finished for deterministic screenshots.

An independent read-only reviewer inspected source plus actual desktop/mobile,
four-direction and five blink captures: no actionable findings. Captures under
`evidence/five-mascots/` identify the source revision. Route captures use an
intercepted five-talk GET fixture; they do not establish remote persistence.
The approved home/feedback/results page files and shared shell are unchanged.

Publication uses the existing PR #42 and isolated QA branch only. Preview
protection remains enabled. A Ready deployment and local browser passes do not
certify an authenticated remote form-to-dashboard journey. No shared Neon tests,
production deployment, merge, account-data access or security bypass is part
of this change. The prior static app research remains documented separately in
[the motion investigation](bot-motion-investigation.md); no further app inspection
was required for this authored implementation.
