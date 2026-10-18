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

- Unit tests: 289 passed, including RED-to-GREEN locale, form and hero checks.
- Production build: passed, including streamed query-parameter handling.
- Typecheck: passed.
- Lint: passed with one pre-existing radio aria-invalid warning.
- HTTP smoke checks: 4/4 passed without database credentials or valid writes.
- Independent review: control contrast corrections applied (minimum 3:1
  boundaries, selected/unselected star symbols); further review in PR.

## Browser evidence

Local headless Chromium launch is blocked by the execution sandbox. The cloud
browser cannot reach this workspace's loopback server. Therefore no local
visual-completion claim is made. The CI browser suite captures all three routes
at 390px and 1440px, in both languages, using explicitly synthetic intercepted
responses and no database credentials. Screenshots are attached to the test
report. Review these artifacts and the deployment preview before acceptance.

Legacy tests for the superseded mascot/sidebar presentation are being updated
to the new design while retaining navigation, keyboard, form, error and
analytics behavior checks. This preview does not change the frozen workshop
checkpoint, tutorials or slides and must not be merged before visual review.
