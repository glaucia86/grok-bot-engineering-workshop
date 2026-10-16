# Talk results readability

Issue [#37](https://github.com/glaucia86/grok-bot-engineering-workshop/issues/37) replaces the growing vertical chart with horizontal bars, complete wrapped talk names, one-decimal averages and response counts. The exact-values table remains available without hover. This branch is stacked on [#39](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/39), the shared shell for #35.

## Data and interaction

Every talk has one bar on a fixed 0–5 scale: its width is `average / 5 * 100%`. The API supplies the existing rounded average; no grouping, rounding, ordering or persistence code changes. Browser fixtures also exercise `Talk A`/`talk a` with a 4.25 mean displayed as 4.3. Names wrap even when they contain no spaces. No chart scroll container or page-level horizontal scrolling is needed.

Loading has one accessible status and three decorative placeholders. Initial failure has a retry button and no table or invented metrics. Empty results link to the existing feedback form. During a submission-triggered refresh, the previous results stay mounted and explicitly say they may be stale. A failed refresh says **Feedback saved. Results could not refresh.** Retry updates results without suggesting a successful submission was lost. Superseded requests remain aborted.

Installed Recharts 3.8 supports `isAnimationActive` and `animationDuration`; these were inspected before choosing native HTML/CSS bars. The native presentation keeps full labels and counts in normal document flow at 320 pixels, avoids SVG minimum widths and truncated ticks, and needs no new dependency. The package lockfile is unchanged. It also avoids a separate chart accessibility interaction when the whole dataset is already readable in text and the table.

Bar entrance lasts 240ms, keyed by talk name and average. An unchanged average, count-only refresh or ordinary rerender preserves the bar element and does not replay it. A changed average creates one new entrance. Values and the table expose final numbers immediately; numbers, ordering and layout dimensions do not animate. Initial result/state opacity uses 160ms. Reduced motion disables bar, opacity and placeholder animation. A settled results view has no continuing animation loop.

The dashboard uses #35's ink, muted text, green accent, system typography and spacing. Its selectors are scoped under `.dashboard-root`. One import in the shared stylesheet loads the component CSS: a component JavaScript CSS import reproduced a Windows Turbopack worker failure, while the shared CSS entry point builds successfully. API routes, statistics, database, checkpoint, slides and workshop guide are unchanged.

## Actual local renders

All linked PNGs are **intercepted local API fixtures**, not a remote database or persistence test. The baseline was captured before production edits at main `c69fa31ecccc85b5d8b9023b72568d319f2e2995`, using the actual Next development app; its development indicator is visible. The redesigned images use the actual production build at code commit `fdb227f` on shell `0d10c3152e92582790959acb3104015a15c28f3f`, Chromium on Windows, DPR 1, and loopback port 3192 with `DATABASE_URL` blank. The shell and dashboard change between these image sets, so they show the combined product result rather than attributing every visual difference to #37. The same talk fixtures are used at each size: zero, one, five or twenty summaries, including a long sentence and an unbroken string.

| Viewport | Talks | Baseline fixture | Integrated redesign fixture |
| --- | ---: | --- | --- |
| 390×844 | 0 | [Before](evidence/37/baseline/baseline-0-talks-390-local-fixture.png) | [After](evidence/37/after/redesign-0-talks-390-local-fixture.png) |
| 390×844 | 1 | [Before](evidence/37/baseline/baseline-1-talks-390-local-fixture.png) | [After](evidence/37/after/redesign-1-talks-390-local-fixture.png) |
| 390×844 | 5 | [Before](evidence/37/baseline/baseline-5-talks-390-local-fixture.png) | [After](evidence/37/after/redesign-5-talks-390-local-fixture.png) |
| 390×844 | 20 | [Before](evidence/37/baseline/baseline-20-talks-390-local-fixture.png) | [After](evidence/37/after/redesign-20-talks-390-local-fixture.png) |
| 768×1024 | 0 | [Before](evidence/37/baseline/baseline-0-talks-768-local-fixture.png) | [After](evidence/37/after/redesign-0-talks-768-local-fixture.png) |
| 768×1024 | 1 | [Before](evidence/37/baseline/baseline-1-talks-768-local-fixture.png) | [After](evidence/37/after/redesign-1-talks-768-local-fixture.png) |
| 768×1024 | 5 | [Before](evidence/37/baseline/baseline-5-talks-768-local-fixture.png) | [After](evidence/37/after/redesign-5-talks-768-local-fixture.png) |
| 768×1024 | 20 | [Before](evidence/37/baseline/baseline-20-talks-768-local-fixture.png) | [After](evidence/37/after/redesign-20-talks-768-local-fixture.png) |
| 1440×900 | 0 | [Before](evidence/37/baseline/baseline-0-talks-1440-local-fixture.png) | [After](evidence/37/after/redesign-0-talks-1440-local-fixture.png) |
| 1440×900 | 1 | [Before](evidence/37/baseline/baseline-1-talks-1440-local-fixture.png) | [After](evidence/37/after/redesign-1-talks-1440-local-fixture.png) |
| 1440×900 | 5 | [Before](evidence/37/baseline/baseline-5-talks-1440-local-fixture.png) | [After](evidence/37/after/redesign-5-talks-1440-local-fixture.png) |
| 1440×900 | 20 | [Before](evidence/37/baseline/baseline-20-talks-1440-local-fixture.png) | [After](evidence/37/after/redesign-20-talks-1440-local-fixture.png) |

Additional fixtures: [320 pixels, twenty long labels](evidence/37/after/redesign-20-talks-320-local-fixture.png), [slow loading under reduced motion](evidence/37/after/slow-loading-reduced-local-fixture.png), [initial retrieval failure](evidence/37/after/initial-error-local-fixture.png), [saved feedback with failed results refresh](evidence/37/after/saved-refresh-failed-local-fixture.png), [reflow after retry](evidence/37/after/320-reflow-local-fixture.png), and [200% CSS zoom](evidence/37/after/200-percent-zoom-local-fixture.png). CSS zoom is an explicit layout test, not a claim about native browser UI zoom. Browser assertions verify no page overflow at all four widths, including twenty long labels.

## Validation and reproduction

The new dashboard tests failed before implementation for the missing saved/refresh-failed distinction, retained results during refresh and twenty proportional bars; all ten dashboard tests pass afterward. The new figure-opacity assertion separately failed with `0s` before the 160ms transition was added. The full MVP suite passes 121 tests. Build, TypeScript and all three loopback HTTP checks pass. Lint has zero errors and one pre-existing form `aria-invalid` warning, owned by #36.

The integrated production app passes all local browser scenarios, including #35 shell navigation/reflow, transport/evidence safety tests, the sixteen results size/data fixtures, reduced/static loading, keyboard retry, exact values, 320-pixel reflow and CSS zoom. Normal-motion checks submit through the real form and revision mechanism: count-only updates preserve the same bar with zero new animation starts; an average change starts exactly one bar animation; no running bar animation remains after settling. Quantitative assertions compare rendered bar widths against the fixed 0–5 scale, rather than merely checking that bars exist.

Reproduce from `mvp/` with Node 24:

```sh
npm ci
npm test
npm run lint
npm run build
npm run typecheck
npm run verify:http
npx playwright install chromium
npm run test:e2e
```

The committed local Playwright configuration runs **all** `local-*.spec.ts` tests against its owned production server at port 3187, with a blank database URL. This evidence run used an equivalent ignored configuration on port 3192 to avoid other worktrees. `local-results.spec.ts` generates fixture screenshots in the Playwright output directory. Its optional `RESULTS_BASELINE=1` flag captures the existing presentation without asserting redesigned selectors; use the baseline revision for baseline captures. The matrix's four added 320-pixel redesign images supplement the required three-view comparison.

## Bundle scope and acceptance limits

The same production route set's complete `.next/static` JavaScript/CSS disk totals are 1,134,092 bytes for the #35 shell and 784,187 bytes for this integrated build, a reduction of 349,905 bytes. Per-file gzip totals are 340,834 and 239,101 bytes, respectively, a reduction of 101,733 bytes. [Shell asset inventory](evidence/37/shell-production-assets.json) and [results asset inventory](evidence/37/production-assets.json) retain the paths and sizes. These are build-asset measurements, not transfer-size, startup-speed, Core Web Vitals or field-performance claims. Baseline and redesigned screenshots use different server modes and cannot support a timing comparison. No animation or chart package was added; the results route no longer imports Recharts.

Local fixture screenshots, tests and CI do not establish isolated deployed preview access, Neon configuration or persistence. The actual isolated preview journey under #16 remains **BLOCKED** until that separately authorized environment and evidence are available. No remote QA, production migration, publication or merge was performed by this change.
