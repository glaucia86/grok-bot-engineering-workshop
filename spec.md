# Talk Feedback MVP — technical specification

Scope source: [inception](docs/inception.md). Historical snapshot: main at [`b34cb56`](https://github.com/glaucia86/grok-bot-engineering-workshop/commit/b34cb56c7f094da6474456825940bef889deabae), October 15, 2026. Approved acceptance refinements are recorded in [PR #9](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/9), pending human merge at that historical snapshot. This specification supplements the inception; it neither replaces it nor certifies acceptance.

Current implementation status (October 16, 2026): PRs [#9](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/9), [#10](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/10), [#26](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/26) and [#27](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/27) are merged. Main has the reference form/dashboard, case-insensitive grouping and optional comments. The historical descriptions below explain the earlier inspected tree; they do not describe missing reference UI today. The separate checkpoint retains the intentional UI gaps. Merged code and approved criteria do not certify remote acceptance; retain BLOCKED for missing isolated preview/persistence evidence.

## Problem Statement

Workshop attendees need to see an engineering bot team deliver a small, observable feature in 90 minutes: submit feedback, see a talk's rating change, inspect evidence on a PR, and retain human control over approval and merge. Provisioning infrastructure during the session would consume the time needed to demonstrate that loop.

## Solution

Prepare a complete reference application on main before the workshop, including the form and dashboard, through reviewed PRs and human merges. Maintain a separate frozen checkpoint/mvp-base revision with the deliberate exercise gaps. During the workshop, participants build those features from that checkpoint and compare with the complete reference, verify the real preview journey, and retain human approval/merge control.

The repository contains two independent applications. The root Fastify exercise remains an in-memory teaching example. The Next.js MVP is a separate application with persistent feedback. At the inspected snapshot, its base API, validation, database migration, and UI primitives exist; the form and dashboard do not yet. That is a historical implementation snapshot; the reference UI has since merged through #26/#27, while the exercise checkpoint remains incomplete by design. Do not present the starter homepage or a successful deployment as the finished MVP.

### 90-minute teaching boundary

The October 17 scope decision prioritizes the essential engineering loop within the existing 90-minute slot. The [time budget and cut line](docs/inception.md#90-minute-budget-and-cut-line) preserve time to create the three bots, test, review and recover. They are a planning budget, not proof that a full timed rehearsal has passed.

- **Core exercise:** from the frozen starter, build the feedback form and a simple results view using the existing shared schema, `POST /api/feedback` and `GET /api/feedback`. Keep confirmation/reset, rejected-input retention, grouped average/count, an average-per-talk chart and empty/error states. Create FDE, QA and DevOps, inspect commit-specific evidence, and leave the approval/merge decision to the human.
- **Reference enhancement:** the approved reference on main includes a selected-talk distribution of ratings 1–5 and written feedback, supplied by `GET /api/feedback/insights`. Show it as a prebuilt example or optional extra only after the core is verified. Implementing that endpoint, its detail UI and the polished reference layout is **not required** for the starter exercise. Do not infer distribution or comments from aggregate averages/counts.
- The core exercise is compared with the reference's shared behavior, not pixel-for-pixel feature parity. The approved reference UI stays intact. The exercise's average-per-talk chart and the reference's detailed distribution have different explicit purposes; neither is evidence that the other's chart criterion ran.
- Infrastructure, credentials, migrations, role-skill availability and isolated preview readiness must be prepared before the session. If remote acceptance is blocked, use previously verified, clearly labeled evidence for explanation and record BLOCKED; a shorter agenda never turns local fixtures into remote proof.

## User Stories

1. As an attendee, I want to identify a talk and myself when leaving feedback, so that my submission has useful context.
2. As an attendee, I want to submit a required integer rating from 1 to 5 and an optional comment, so that I can leave a score with or without an explanation.
3. As an attendee, I want surrounding whitespace removed, so that whitespace-only talk and author values are rejected and blank optional comments are stored consistently.
4. As an attendee, I want the same field errors in the form and API, so that invalid input is explained consistently.
5. As an attendee, I want a confirmation and a reset form after success, so that I know the submission was accepted.
6. As an attendee, I want rejected submissions to retain my input, so that I can correct it without retyping everything.
7. As a viewer, I want each talk's average and submission count, so that I can interpret its feedback.
8. As a viewer, I want differently capitalized versions of the same talk grouped together, so that its rating is not split across bars.
9. As a viewer, I want readable chart values and one-decimal averages, so that the graph communicates the same values as the dashboard.
10. As a viewer, I want an empty state when there is no feedback, so that an empty dataset is not mistaken for an error.
11. As an attendee, I want my feedback to remain after page reload and application restart, so that a successful submission is durable.
12. As the QA engineer, I want to verify creation through public responses and the dashboard, so that acceptance does not require direct access to the production database.
13. As the QA engineer, I want isolated, identifiable test data, so that verification does not corrupt another run or real feedback.
14. As the presenter, I want prepared infrastructure and a working checkpoint before the event, so that live time is spent on the feature.
15. As the human tech lead, I want commit-specific verification evidence and independent review, so that I can decide whether to approve and merge.
16. As the repository owner, I want credentials kept in approved secure settings, so that source, logs, and demonstrations do not expose secrets.

## Implementation Decisions

### Application boundaries and current architecture

- The root application uses Fastify and an in-memory store. It retains `POST /feedback`, `GET /feedback`, and `GET /talks/:talkId/rating`. Rating remains optional there; its rating summary counts rated submissions and uses two-decimal averages. The MVP does not silently change that exercise.
- The MVP uses Next.js App Router with TypeScript and React. Route handlers are the application API/BFF; shared Zod validation precedes database access. Drizzle connects to Neon over its HTTP adapter. Node.js 24 and npm are the documented execution baseline.
- Tailwind CSS 4, shadcn/ui primitives, lucide-react, and shadcn/Recharts chart primitives are available for the live UI. At the historical snapshot, their presence alone did not mean the form or dashboard was implemented; current main includes both.
- The Vercel application root is `mvp`. The MVP API is `/api/feedback`; it does not alias the separate Fastify API. The frozen starter has no `/feedback` or `/results` UI. Current reference main has those two UI routes, alongside its homepage; their presence does not change the Fastify contract.
- No new service, authentication system, repository layer, or database abstraction is required by this specification. Use existing validation, route-handler, statistics, and database seams.

### Observable MVP API contract

**POST `/api/feedback`**

- Accept required JSON fields `talkId`, `author`, and `rating`, plus optional `comment`. Talk and author must be strings and remain nonempty after trimming. An omitted, empty, or whitespace-only comment is accepted and normalized to `""`. A supplied comment must be a string (including rejection of `null`) and contain at most 1000 characters after trimming. No additional maximum for talk or author text has been agreed.
- Rating is required, numeric, and an integer from 1 to 5. API strings such as `"5"` are rejected rather than coerced. The form converts its rating control to a number before invoking the same schema.
- A valid request inserts the normalized input and returns 201 with the stored record: `id`, `talkId`, `author`, `comment`, `rating`, and `createdAt`. Current Zod parsing discards unknown object properties; they are not inserted.
- Invalid input returns 400 with an `errors` map. Each field has its first validation message; malformed JSON produces a body-level error. Validation rejection occurs before database access and must not insert a record.
- Current field messages include `talkId must be text` / `talkId is required` (and the corresponding author messages), `comment must be text`, `comment must be at most 1000 characters`, `rating must be a number`, `rating must be a whole number`, and `rating must be between 1 and 5`. The form must show the exact shared message for the same invalid value, not a separate paraphrase. An absent or blank comment has no validation error.
- A missing database configuration or failed database operation must not be reported as successful creation. Current handlers propagate such failures; a new stable server-error response format has not been specified.

**GET `/api/feedback`**

- Return an array of talk summaries with `talkId`, `average`, and `count`; return an empty array when there are no records. This endpoint exposes aggregates, not the authors and comments of individual submissions.
- Every MVP submission has a rating. Count all submissions in the talk's group and round the arithmetic mean to one decimal, half up (`4.25` → `4.3`). JSON numeric `3` remains a number; the dashboard renders it as `3.0` when displaying one decimal.
- Approved target: trimmed talk names are compared case-insensitively. `Talk A` and `talk a` contribute to one average and count. At the historical inspected commit, the statistics function still grouped exact strings; case-insensitive grouping is implemented in [PR #10](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/10), since merged. That patch uses a lowercase grouping key, retains the first encountered spelling for display, and leaves input records unchanged; these are the patch’s implementation choices, not new display-casing requirements. No locale-specific collation, accent folding, slug system, or preferred display casing is agreed here.
- Ordering, pagination, and talk lookup endpoints are not required by the core exercise contract. The reference enhancement has a separate insights endpoint; do not add it to the core exercise implicitly. The current GET reads the stored talk/rating rows and aggregates them in application memory; this is a workshop-scale design, not a scaling claim.

### Form and dashboard: complete reference and checkpoint exercises

- The public form submits the shared contract. On success, show confirmation and reset. On rejection, preserve the entered values and show field errors. No login or administrative flow is introduced.
- Both targets list every talk with feedback, its one-decimal average and count. For the **core exercise**, render one bar per grouped talk, with height equal to the displayed average and a readable value label or tooltip. The **approved reference enhancement** instead pairs its comparison table with a selected-talk five-bin rating-count distribution; do not require an additional average-per-talk chart in that approved UI.
- When there is no data, show the empty state. After a valid submission, the new talk/result must be visible through the dashboard or public GET, and must remain visible after reload. API aggregation alone cannot verify the original comment/author; the POST response covers those fields, while GET/dashboard proves the created contribution.
- The reference uses `/`, `/feedback` and `/results`. The core exercise does not need to reproduce its page arrangement, detailed insights or visual polish. Polling frequency and optimistic updates remain implementation choices, not additional acceptance requirements.

### Persistence and environment lifecycle

- The committed migration creates a `feedback` table with generated serial primary key, required talk identifier, non-null author and comment text, required integer rating, and a creation timestamp defaulting to the database's current time. Optional comments are stored as empty text, preserving the existing NOT NULL column without a migration.
- Validation rules are currently enforced by Zod; the migration has NOT NULL constraints but no rating-range or trimmed-text CHECK constraints. Do not claim that bypassing the API has equivalent validation.
- The Neon adapter reads `DATABASE_URL` at runtime. The migration command reads the process environment directly. Builds do not apply migrations automatically. Provision and apply migrations to the intended environment before testing valid POST/GET calls.
- Development/test isolation is the documented target. The reported current risk is that Playwright would write to the same Neon database used by previews and production. Until that is separated or safely scoped, every test must use a unique talk name with a run-specific identifier; clean up only its own records.
- A unique talk name isolates assertions, not the whole database. Never empty shared storage for an empty-state test. Empty-state checks need an isolated dataset/environment; missing isolation is BLOCKED. No public cleanup endpoint exists in the current MVP, so the authorized setup/cleanup mechanism remains to be implemented and proven.
- Reload persistence and fresh-instance persistence are separate checks. Reopening an isolated local database proves local durability; it does not prove Neon transport, remote schema configuration, or deployed persistence.

### Safety and ownership

- Credentials belong only in approved provider/CI secret settings or authorized local secret handling. No real values in tracked files, terminal output, evidence, PR comments, or chat. Verify configuration without exposing values.
- Preview protection must be handled through an authorized secure automation bypass, not by exposing its value or disabling protection. Missing preview access is a blocker, not permission to substitute local evidence.
- FDE implements and opens a PR; QA independently judges the acceptance criteria; DevOps maintains checks and previews. The human tech lead approves and merges. Bots do not merge.
- Approved QA skill set: `playwright-best-practices`, `playwright-cli`, vendored `create-verification-skill`, and pstack `interrogate` (decided by the presenter: the one exception to the three-skill limit, because `interrogate` is part of pstack). All three bots apply the vendored `principle-prove-it-works` as the done-definition: no bot declares done without proof from the real artifact.

## Testing Decisions

### Acceptance seam

Use the already agreed public journey as the highest acceptance seam: submit the real form on the actual PR preview, inspect POST results/errors, open the dashboard/public GET, and reload. Check visible outcomes and API responses rather than React internals or direct remote database inspection. Capture the tested commit, target URL, commands/actions, outputs, and retained artifacts.

The lower-level seams already present are supporting diagnostics, not substitutes for that preview journey:

- Shared schema/statistics unit tests exercise invalid types, required talk/author text, accepted omitted/empty/blank comments normalized to `""`, trim behavior, comment boundaries, rating boundaries and fractions, aggregation, and rounding. Extend existing cases for case-insensitive grouping and the explicit 4.25 boundary.
- Actual route-handler tests substitute the existing database boundary and check status/payload, normalized insert values, no database access on rejection, empty summaries, and failure propagation.
- Persistence tests invoke those same handlers with Drizzle against an isolated on-disk PGlite database, apply the committed migration, and reopen the database. Direct local test-database queries are test fixtures/assertions, not a requirement for QA to inspect remote production data.
- The production-server HTTP smoke verifier owns its localhost process and blanks `DATABASE_URL`. The frozen starter checks its homepage, legacy `POST /feedback` 404 and invalid feedback 400. Current reference checks the homepage and both UI routes plus invalid feedback 400. Neither verifier sends valid feedback or targets a preview.
- The root Fastify verifier starts its own localhost application. Its pass cannot establish any MVP, Neon, or preview behavior.

### Required final evidence

1. Valid creation and public observation; reject invalid cases without adding a contribution. Accept omitted, empty and whitespace-only comments as `""` in the POST response and storage. Cover comment length after trimming (0, 1, 1000 accepted; 1001 rejected), non-string comments including `null`, missing/blank/wrong-type talk/author fields, and ratings omitted, 0, 1, 5, 6, fractional, and string-valued.
2. Identical field error text in API and form; successful confirmation/reset and rejected-input retention.
3. Grouped talk count and one-decimal mean, including `Talk A`/`talk a` and a mean of 4.25. For the core exercise, average-per-talk bars and labels/tooltips agree with those means. When judging the approved reference enhancement, verify its exact per-score counts and labels against insights data instead; do not derive counts from rounded means or demand the exercise chart in the reference UI.
4. Empty state in isolated data; reload shows the new contribution; a fresh application instance connected to the same test database still observes it.
5. No committed secrets, with all finding values redacted. Do not treat an ignored environment file or a build pass as a secret audit.

The existing MVP CI workflow runs clean install, Vitest, lint, build, typecheck, and HTTP smoke checks for MVP/workflow changes. It has read-only repository permission and no application secrets. Its path filter skips root documentation-only changes; changes under `mvp/`, including its README, trigger it. The historical inspected tree had no Playwright dependency/configuration/tests or preview acceptance workflow. Main now includes the guarded opt-in preview harness from #29; its presence does not establish execution or remote acceptance. Reinspect the current workflow and retained evidence for the tested commit.

PR #9 is merged. Keep overall MVP acceptance BLOCKED until the tested implementation is assessed against those merged criteria with the required isolated preview evidence. AC9 coverage gaps are WARN, not BLOCKED; keep its required cases and CI checks. Failing tests or failed CI remain failures. Missing access, isolation, or evidence remains BLOCKED. A Vercel success status or green local CI is not acceptance.

## Out of Scope

- Login/authentication, an admin area, and email notifications.
- Replacing the legacy Fastify exercise or silently changing its optional-rating contract.
- Editing/deleting feedback as a user feature, one-vote-per-author enforcement, or a new talk catalog.
- New production database provisioning, credential changes, production migrations, or deployment authorization from this document alone.
- Enterprise scaling, pagination, abuse-prevention guarantees, or an invented realtime-refresh contract.
- Spending the live 90 minutes provisioning infrastructure, or replacing the intentionally incomplete exercise checkpoint with the complete reference application.
- Automatic approval/merge or converting this specification into an issue instead of the requested repository file.

## Further Notes

Delivery-boundary update, October 15, 2026: the presenter explicitly requested a ready application on main and a separate checkpoint for exercises. This supersedes the earlier preparation-only base / UI-only-live restriction. Reuse checkpoint/mvp-base; do not move its ref until its exact contents and gaps have been reviewed. The reference must pass full form/dashboard acceptance before event readiness is claimed. The checkpoint must separately prove its supported base behavior and document what participants implement.

This is a synthesis using [to-spec](https://github.com/mattpocock/skills/blob/main/skills/engineering/to-spec/SKILL.md) and its [official guidance](https://github.com/mattpocock/skills/blob/main/docs/engineering/to-spec.md), with the user's explicit `spec.md` destination replacing the skill's default issue-tracker destination. It records decisions and verified source structure; it is not a test-run report.

Source map for reinspection:

- [Inception and acceptance criteria](docs/inception.md), [approved refinements PR #9](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/9), [MVP setup and known limitations](mvp/README.md).
- [MVP route handlers](mvp/src/app/api/feedback/route.ts), [shared schema](mvp/src/lib/feedback-schema.ts), [statistics](mvp/src/lib/stats.ts), [reference page on main](mvp/src/app/page.tsx).
- [Database schema](mvp/src/db/schema.ts), [Neon adapter](mvp/src/db/index.ts), [migration](mvp/drizzle/0000_stormy_jack_murdock.sql).
- [Schema/statistics tests](mvp/src/lib/__tests__/feedback.test.ts), [handler tests](mvp/src/app/api/feedback/route.test.ts), [local persistence tests](mvp/src/db/persistence.test.ts), [HTTP smoke verifier](mvp/scripts/verify-http.mjs), [CI workflow](.github/workflows/mvp.yml).
- [Legacy Fastify implementation](src/app.ts) and [legacy rating design](docs/design/talk-rating.md). The legacy design's no-coercion example is not the MVP contract and is not evidence that Fastify disables its default coercion.

The root READMEs now identify the Next.js MVP as the main track and Fastify as extra practice. [Issue #17](https://github.com/glaucia86/grok-bot-engineering-workshop/issues/17) still tracks final preview-backed instructions and presenter/deck walkthrough; text alignment does not establish rehearsal readiness. The implementation work is tracked in [the issue index](docs/issues/README.md), without duplicating this specification. No standalone glossary or ADR collection was found in the inspected repository tree.
