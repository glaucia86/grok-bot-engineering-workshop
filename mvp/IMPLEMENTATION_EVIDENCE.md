# Reference application evidence — issues #18 and #19

Base: `f68f17bbba3c88a6918bcccab624c1d855a01878`. Branch: `feat/reference-feedback-app`.
Evidence date: 2026-10-15. The PR head identifies the reviewed source revision.

## Design and implementation

Design read: an editorial workshop notebook, warm paper (#f7f4ed), dark ink
(#20291f), terracotta (#b84420) for submission, forest (#285544) for ratings.
System Segoe UI/Helvetica/Arial avoids font downloads; restrained borders and
spacing separate contribution from observation. Form/dashboard share one responsive
workspace. Native radio semantics, associated field errors, focus on first error,
visible keyboard focus, live confirmation, chart labels and an accessible table
support the same journey across desktop and mobile.

The design-taste-frontend skill was read before implementation (including its
warning that dashboard-specific choices require context). Existing shadcn UI and
Recharts were reused. Open Design was checked: no installed command, app directory
or connector was available. Its upstream repository was inspected; the tool was
not executed or installed. No Open Design-generated artifact is claimed.

The shared Zod/API/database/statistics contracts are unchanged. The form converts
its rating control to a number before validation. A validated stored-record
response with status 201 is required before confirmation/reset; rejected/network
failures preserve inputs. Success triggers a public GET refresh, without polling.
The dashboard renders the aggregate API; it does not add a summary service.

## Executed verification

Commands run from `mvp/`, Node 24.19.0:

| Command | Observed result |
| --- | --- |
| `npm test -- src/components/feedback-form.test.tsx` before implementation | RED: 6 failures, missing real form labels |
| Same command after implementation | GREEN: 6 passed |
| `npm test -- src/components/feedback-dashboard.test.tsx` before implementation | RED: 3 display failures; later 4 lifecycle failures |
| Same command after implementation | GREEN: 7 passed |
| `npm test` outside Windows AppContainer | 72 passed, 5 files; exit 0 |
| `npm run lint` | exit 0 |
| `npm run build` with DATABASE_URL explicitly blank | exit 0; `/` static and `/api/feedback` dynamic |
| `npm run typecheck` | exit 0 |
| `npm run verify:http` | 3/3 PASS: homepage200, legacy route404, invalid API400; no valid write |
| `node node_modules/@playwright/test/cli.js test --config=playwright.config.ts` outside AppContainer | 4 passed in 6.4s; local Chromium fixture journey, exact shared errors, 1001-character rejection/retention, keyboard radio selection, normalized creation/reset, reload, server failure/retry, chart/table values and bar geometry |
| `git diff --check` | exit 0 |

The initial sandbox run had 71 passes and one PGlite reopen failure. Diagnosis
captured PostgreSQL checkpoint rename `Operation not permitted`; the same isolated
test and full suite passed outside AppContainer. No persistence test was weakened.
The initial build failed in Turbopack's CSS child process because the two lockfiles
made it infer the parent Fastify root. Explicit `turbopack.root` fixes the separate
MVP boundary. Stale generated nested build output was removed; no source was lost.
Playwright files are excluded from Vitest collection and run through their own CLI.
The browser's first sandbox run could not probe its owned localhost server;
that owned process was stopped before the successful outside-AppContainer run.
No remote database connection was enabled. Desktop (1280px), mobile (390px),
empty-state and two-talk screenshots were visually inspected. Labels and table
remain readable, the mobile document does not overflow, and the two SVG bar
heights have the same ratio as their displayed 4.3 and 3.0 averages.

## Acceptance map and remaining gate

| Inception criterion | Supporting evidence / status |
| --- | --- |
| AC1–3 normalization, strict types, required fields, numeric rating | Existing real-handler + isolated PGlite tests; boundary matrix in schema tests; PASS locally |
| AC4 shared exact errors and numeric form conversion | Form component tests + shared schema import; PASS locally |
| AC5 confirmation/reset or retained rejected input | Form component tests, browser fixture checks; local scope only |
| AC6 case-insensitive grouping/count/one decimal/4.25→4.3 | Existing API aggregation reused; explicit half-boundary unit case; dashboard tests |
| AC7 one bar per talk / readable values | Recharts data bound to API averages; browser SVG labels and table checks |
| AC8 empty dataset | Isolated local fixture/PGlite; remote isolated-empty evidence BLOCKED |
| AC9 unit/handler checks and CI | 72 local checks PASS; workflow preserves prior checks and adds local Playwright with retained artifacts; CI result is separately observable on PR |
| AC10 actual preview, isolated data, fresh remote instance | BLOCKED by #16; no shared Neon writes authorized/executed |
| AC11 reload persistence | Local on-disk PGlite close/reopen PASS; browser fixture reload separately labeled; remote reload BLOCKED |
| AC12 secrets | Independent scan of 118 tracked/new nonignored textual source files: zero matches for examined provider-token, private-key, credentialed Postgres URL and quoted-secret assignment patterns. Values never printed. Not a history/ignored-file audit |

Independent reviewer read code, tests and preview safety gates against the approved
specification. No confirmed functional/security defect was found. The initial
requests were to resolve the PGlite verification failure and assert rendered chart
values; both were addressed with subsequent evidence. Browser QA is owned by a
separate agent, not inferred from the implementer's report.

## Preview safety

`npm run test:e2e:preview` refuses execution without explicit HTTPS target, exact
40-character deployed commit and `MVP_PREVIEW_ISOLATED_AUTHORIZED=true`. Those
values attest to an authorized environment; they do not provision one or authorize
writes by themselves. See `e2e/README.md`. No preview URL, protection bypass,
authorized isolated dataset, setup/cleanup, or fresh remote instance was available.
The remote command was only checked for its refusal to run without prerequisites.
Local browser fixtures and PGlite durability do not satisfy preview acceptance.

No main push, merge, production deploy, migration, credential change, checkpoint
ref movement, or slide/guide edit is included. Overall MVP acceptance remains
BLOCKED until QA supplies actual preview evidence and Glaucia approves.

## Independent browser result

`npm run test:e2e` / `npx playwright test --config=playwright.config.ts`,
Chromium on loopback production build with API fixtures: 4/4 PASS. QA used an
approved process outside AppContainer because sandbox loopback probing failed.
Includes blank/1001-character rejection and retained values, numeric normalized
submission/reset, fixture-backed reload, failed-server retention, retry, keyboard
radio selection, visible one-decimal SVG labels and matching table values.
Desktop 1280px and mobile 390px captures were independently inspected for clipping
and document overflow; no defects observed. Tracked captures:

- [Desktop](evidence/desktop-local-fixture.png)
- [Mobile](evidence/mobile-local-fixture.png)
- [Empty fixture](evidence/empty-local-fixture.png)
- [Two talks, proportional bars](evidence/two-talks-local-fixture.png)

These browser checks use intercepted API responses. The separate real-handler
PGlite suite proves local normalized storage/reopen. Neither constitutes remote
preview or Neon acceptance.
