# TalkFeedback visual and language preview

Reference inspected on 2026-10-18:
https://modulify.ai/dashboard/projects/talkfeedback

## Scope

This iteration applies the observed dark-stage/paper-card visual language to
Home, Feedback and Results, with local fonts and EN-US/PT-BR controls. Language
preference is kept in localStorage when available. Server rendering starts in
English; the saved preference is restored after hydration. Changing language
does not reset the form or reload results. The selected hero rating is passed
through a validated query parameter to the existing form.

The data contract is unchanged: talk title, author and rating are required;
comments are optional and limited to 1,000 characters after trimming. Results
hide author names. No migrations, new authentication, live polling, upsert,
moderation, catalog metadata, highlights or QR functionality are introduced.
No reference names, schedules, testimonials or metric values were copied.
Home metrics and talk labels come from the existing API. Its decorative chart
is explicitly labeled as an illustration.

## Checks before publication

- Unit tests: 293 passed, including RED-to-GREEN locale, form and hero checks.
- Production build: passed, including streamed query-parameter handling.
- Typecheck: passed.
- Lint: passed with one pre-existing radio aria-invalid warning.
- HTTP smoke checks: 4/4 passed without database credentials or valid writes.
- Independent review: control contrast corrections applied (minimum 3:1
  boundaries, selected/unselected star symbols); further review in PR.

## Browser evidence

Local headless Chromium launch is blocked by the execution sandbox. The cloud
browser cannot reach this workspace's loopback server. Before the measured
layout refinement, CI run 39158362804 passed all 80 browser cases on both the
PR head and merge ref. Its twelve desktop/mobile, EN-US/PT-BR screenshots were
downloaded and visually inspected. The deployment preview requires Vercel access.

The current refinement follows measurements from the user-provided Modulify
preview and visible container/header source: 1152px outer containers, 64px
desktop header, 20px/32px gutters, 160px/176px desktop hero padding, 448px
rating card, overlapping metrics, dark results band and inset final CTA.
Mobile keeps the existing two-row accessible navigation, rather than claiming
an identical hamburger menu. Existing real metrics and truthful copy are retained.
The complete hero source is still pending from the user.

New geometry assertions verify the overlap, card/container widths, desktop
header height, dark band and inset CTA alongside the existing overflow and
privacy-disclosure checks. These refinements require fresh CI screenshots and
visual review before acceptance. Screenshots use synthetic intercepted responses,
not real participant records, and are attached to the Playwright report.

Legacy tests for the superseded mascot/sidebar presentation were updated
to the new design while retaining navigation, keyboard, form, error and
analytics behavior checks. This preview does not change the frozen workshop
checkpoint, tutorials or slides and must not be merged before visual review.
