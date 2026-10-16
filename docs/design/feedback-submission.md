# Feedback submission refinement (#36)

Refines the existing reference form on #35, preserving field names/order, validation messages, native required integer1-5 stars, optional comments and API/reset contracts. No new dependencies, API/schema/database change, checkpoint/slides/guide change.

Pointer hover previews a score while the checked radio and accessible committed text stay distinct. Leaving or using the keyboard restores the committed representation. Native Tab/arrows/Space and44x48px targets remain. Decorative icons cannot intercept pointer events. Normal-mode scale1.04 uses the shared160ms control token; reduced mode removes scale/transitions immediately. Essential state text is immediate, with no progress loop or delayed animation.

Submit/retry keeps48px height and constant width during saving. The existing ref prevents duplicate requests, including programmatic resubmission during a delayed response. Failure retains every field/star and exposes Try again. Success resets the established fields, keeps accessible confirmation while editing and offers View results at the existing anchor, without focus movement, auto-scroll or dismiss timer.

## Actual evidence and verification

[Actual screenshots and metadata](evidence/36) contain14baselinePNGs (seven states at390x844 and1440x900 on #35 shell0d10c31, with form source hash matching mainc69fa31), then28afterPNGs covering every state in normal/reduced mode. States: untouched, focused, selected, validation, saving, server failure and saved. Two full-page integrated captures, production asset inventory, browser timing/CLS data and local Playwright trace supplement the crops. All API responses/delays/failures are intercepted local fixtures; they cannot establish persistence or deployed acceptance.

TDD: new unit tests failed for missing pointer preview and explicit retry, then passed. Browser checks exposed SVG click interception and reduced-motion CSS specificity leaving scale1.04 active; both were fixed and rerun. Integration with #35 exposed first-input416px; reducing the scoped form-note margin24to12 restored392px at390width. The original compact-shell assertions remain.

Final integrated validation:120/120Vitest;12/12production local Chromium scenarios, including both form motion modes, existing feedback behavior, shell keyboard anchors/reflow/zoom and preview-safety fixtures. Lint0errors/1existing radio aria-invalid warning; types, build andHTTP3/3 passed. Independent review compared mobile selected/failure/saved/reduced and desktop validation with actual baselines; no actionable findings. Tests cover first-error focus, duplicate protection, preserved values, immediate keyboard selection, stable saving geometry,320px reflow and200%CSSzoom. CSSzoom is an explicit layout test, not native browser UI zoom proof.

Contrast on white: ink16.38:1, muted6.39:1, green/white7.45:1, error7.27:1, control boundary3.69:1. Visible2px focus outlines remain. Error/confirmation/rating use text and semantics as well as color. Comment is explicitly optional.

All production static JS/CSS assets versus #35:1,134,092to1,138,568bytes (+4,476); gzip340,834to341,675 (+841). No package added. Same-device five-talk integrated capture had no page overflow, CLS or longtask over50ms at390/768/1440. This small local sample is not a CWV score, route transfer size or controlled performance improvement claim. No per-frame JavaScript work or layout-dimension animation was introduced.

## Reproduce and remaining boundary

From mvp run npmci, npmrunbuild and the local Playwright config (local-*.spec.ts; DATABASE_URL empty). local-form-polish.spec.ts captures28afterstatePNGs and verifies both motion modes. For the unchanged-form baseline, start built #35 on a loopback-only port with DATABASE_URL empty, then run `node scripts/capture-form-baseline.mjs <baseline-mvp-directory> http://127.0.0.1:<port> <output-directory>`. It uses the existing Playwright install, verifies source hashes and intercepts API responses. Install local Chromium first; PLAYWRIGHT_BROWSERS_PATH may reference a workspace-owned install. Stop the local server afterwards.

The inherited `node scripts/capture-shell.mjs <phase> <output-directory>` reproduces the full-page trace, timings and asset inventory with the same viewport/data/device profile as #35. Use the recorded revision/fixture labels; never compare a development server with a production build.

Real preview/API/confirmation/persisted-results acceptance remains BLOCKED by #16 until authorized isolated preview/database binding and access are independently verified. Glaucia retains review/merge control. This PR is stacked on #35 and does not duplicate the shell diff or claim #37 dashboard completion.
