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

This isolated commit contains CSS and design notes only. Route integration, actual app rendering at 320px and desktop, interaction checks, and production checks belong to the integrating worktree. No screenshot or browser-pass claim is made here. Any follow-up visual findings should be evaluated against the actual integrated routes and real loading, empty, error, and populated states.
