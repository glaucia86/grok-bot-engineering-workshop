# Loop Engineering pages

This is the visual layer for the authorized three-page reference UI: Home, Leave feedback, and Talk results. Existing feedback contracts, validation, database behavior, and workshop materials remain outside this CSS change. The previously mentioned reference images were unavailable to this implementer; this document makes no claim to have inspected them.

## Direction

Home introduces the engineering feedback loop through large, tightly set type and a single geometric process diagram. Feedback uses a bounded white form with a quieter supporting column. Results gives real aggregate data a full-width working surface. Navigation consistently exposes all three destinations, with a filled active state and 44px minimum targets.

The inherited identity is dark green #16604f, ink #172126, muted #53616a, cool canvas #f5f6f8, white #ffffff, and pale green #edf5f2. Segoe UI/Helvetica Neue/Arial remains the local font stack: no network fonts or runtime dependencies. Display text uses weight 650, tracking no tighter than -.04em, and a maximum 88px size. Body copy uses readable measures and 1.6–1.7 line height. Small controls use 6px radii; working surfaces use 12px radii.

The loop is a process diagram, never an invented chart or product statistic. Only the results component presents numerical feedback. Step numbering belongs to the actual three-step sequence. The existing system font stack is retained; no extra heading label is needed.

## Implementation contract

`mvp/src/app/loop.css` is scoped beneath `.loop-site`; integration imports it from the existing global stylesheet. Shared shell classes are `.loop-header`, `.loop-main`, and `.loop-footer`. Home uses `.loop-hero`, `.loop-diagram`, and `.loop-steps`; the working pages use `.loop-page-intro`, `.loop-task-grid`, `.loop-context`, and `.loop-results-frame`. Existing form and dashboard internals retain their semantic controls and behavioral states.

Desktop content is at most 1248px wide. At 700px the navigation gets a dedicated row and hero and feedback grid stack. Results bars use one column at every width, aligned with the shared 0–5 scale. At 360px actions stack and working-surface padding reduces to 20px. Full content remains in flow; no fixed overlay, clipped label, fake data, image download, or entrance choreography is added.

Focus uses a 3px green outline and 4px offset. Navigation active state supplements `aria-current="page"`; reduced motion removes transitions and existing descendant animations. Forced colors retains control borders and a visible active navigation outline. Text selection and caret follow the palette.

## Evidence and limits

Read the existing root PRODUCT.md, workshop-workspace design record, form/dashboard styles, and installed Next.js CSS and routing guides. Frontend Design, Impeccable new-work/craft-floor, and UI UX Pro Max guidance informed the implementation. The local UI UX query returned a minimal Swiss-style recommendation; its blue/orange palette and external font suggestion were not adopted because this implementation preserves the approved green identity and existing local font stack. A focused keyboard/navigation query also informed active-page and focus checks.

The integrated implementation provides `/`, `/feedback`, and `/results`. The form confirms a successful save before offering an explicit results link. Home performs no feedback fetch and renders no form or dashboard. The API, schema, database, and optional-comment contract are unchanged.

Actual production-build captures at 1440, 390 and 320 CSS pixels are retained in [evidence/loop-pages](evidence/loop-pages), with synthetic intercepted GET aggregates explicitly recorded in `captures.json`. Captures wait for bar animations to finish. These are local rendering evidence, not remote persistence evidence. The rendering source SHA in the metadata predates only test/tooling/evidence follow-ups; the route and CSS blobs are unchanged.

The full local browser suite passed 42/42, HTTP checks 4/4, and unit/API/PGlite tests 134/134. Build and types passed. Lint retains one pre-existing radio aria-invalid warning, with zero errors. Independent read-only review inspected nine captures plus form saved/failure states, checked route separation and test migration, and reported no visual or functional defect. Its capture-tool compatibility finding was addressed by making `capture-shell.mjs` visit all three routes, record a nullable form position, and wait for animation settlement. The baseline-form helper remains explicitly historical.

Reproduce current route captures from mvp with `node scripts/capture-shell.mjs loop-pages <output-directory>` after the production build and a local Chromium installation. This emits nine route/view combinations at 390/768/1440 pixels, plus trace and runtime/asset metadata. It uses an owned loopback server, blank DATABASE_URL and intercepted API responses. Historical one-page timing comparisons are not equivalent to the new route composition.
