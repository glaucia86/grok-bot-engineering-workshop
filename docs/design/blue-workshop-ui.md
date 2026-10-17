# Blue workshop product UI

## Scope

Visual redesign of the existing `/`, `/feedback`, and `/results` routes from main `c3135c1a011c9cbd172f45b417b0bc69c9ed13a7`. This is an isolated draft for visual review, not authorization to merge or deploy to production.

References inspected visually: [Untitled UI dashboard 04](https://www.untitledui.com/react/components/dashboards/dashboard-04) and [dashboard 01](https://www.untitledui.com/react/components/dashboards/dashboard-01). Their restrained hierarchy, sidebar, spacing and white surfaces inform the design; no premium source code or fictional business metrics were copied.

## Changes

- A company-style home with its own horizontal header. The feedback and results routes retain the 232px desktop app sidebar and visible three-link mobile navigation, active route, breadcrumb and skip link.
- A product-style banner, clear workshop benefits and feedback/results actions. The internal process name is removed from the UI. Original vector mascots, colors, gaze and blinking behavior are preserved, with a separate reduced-motion-safe parallax artwork layer.
- A contained feedback form with an adjacent writing guide, field help, native keyboard-operated stars and accurate visibility copy. Free-text talk, required name/rating, optional comment and API contracts are unchanged.
- Factual response/talk totals, a dominant selected-talk distribution, a single interactive comparison table and a separate comments panel. The dashboard uses the existing shadcn/ui Card, Button and Chart components with Recharts, rather than hand-built comparison bars duplicated by a table. The graph plots individual rating counts from the existing insights endpoint; it does not infer a workshop-wide mean.
- Large comparison tables retain bounded keyboard-accessible scrolling. No overall average is inferred from rounded per-talk averages. No trends, anonymous-submission claims or synthetic content are added to the application.
- Improved validation focus order and contrast regression coverage. Shared and component styles have explicit ownership instead of accumulated overrides.

## Verification and limits

Tests were added and observed failing before corresponding changes. Independent review identified low-contrast text and control boundaries; both were corrected with computed-style contrast regressions.

The MVP unit suite, production build, TypeScript checks, ESLint and four HTTP smoke checks pass locally. ESLint retains the existing native-radio `aria-invalid` warning. The independent root Fastify application passes its 20 scoped tests and 9 HTTP verification checks. Running the root's unscoped `npm test` also collects the separate MVP tests without the MVP configuration and fails; this existing root command isolation problem is outside this UI change.

Local browser launch is blocked by this execution environment's IPC sandbox. The unchanged `MVP validation` GitHub workflow runs the full local-fixture Playwright suite for the exact draft head and merge candidate, retaining desktop/mobile screenshots and traces as artifacts. Those checks must be reviewed before acceptance. The new route/form/results specs cover 320px, 390px, 768px and/or 1440px, focus/navigation, long lists, retry and saved states.

All browser fixtures intercept the API; persistence tests use isolated local PGlite. No shared Neon records are created or changed. A Vercel Ready deployment alone does not establish remote persistence or visual approval. Preview remains protected, and no bypass credentials are created.

## Revision after visual feedback

The initial PR #46 layout was not visually approved. The follow-up replaces its report-like dashboard composition and explicitly checks sparse data (two talks with one response each), not only a populated five-talk fixture. The corporate home, banner, parallax and Lucide icon direction are new user requirements. The form fields and backend contracts remain unchanged.

The UI package dependencies already exist in the project: shadcn/ui base-nova components and Recharts 3.8. No paid component library is required. Chart composition follows the current [shadcn chart documentation](https://ui.shadcn.com/docs/components/base/chart) and [Recharts BarChart API](https://recharts.github.io/en-US/api/BarChart/). Browser evidence and the exact tested revision are recorded in the draft PR; passing checks are technical evidence, not visual approval.
