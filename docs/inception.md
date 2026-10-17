# Inception: Talk Feedback MVP

## 1. Goal

This document frames the work for the live Packt workshop **"Build Your First Engineering Bot with Grok Bot"** (November 17, 9:00–10:30 AM ET). We will turn Talk Feedback into a small but real MVP. Ninety minutes is not much time, and the audience needs to *see* something happen, so every decision below favors a visible result: a form you can submit, a chart that moves, and a preview URL that appears on the pull request.

This defines the Next.js MVP reference application and its separate workshop exercise checkpoint, not the existing Fastify API. The acceptance criteria in section 5 apply to that migration; the current workshop exercise keeps its existing contract until the migration is implemented and verified. The 90-minute schedule agrees with both READMEs on main after PR #4.

## 2. MVP scope

The core workshop MVP has three parts. First, a **public feedback form** with required talk, author and rating from 1 to 5, plus an optional comment. Second, a **talk dashboard** with grouped average/count and a simple average-per-talk chart. Third, **persistence in Postgres**, prepared before the session. The approved reference on main adds selected-talk rating distributions, written feedback and a polished layout. Those insights are an optional extra or prebuilt showcase, not required implementation for the 90-minute exercise; see the [teaching boundary](../spec.md#90-minute-teaching-boundary).

We are leaving **login/auth, an admin area, and email notifications** out on purpose. Each one costs stage time and teaches nothing about engineering bots. A form, a chart, and a database are enough to show the full loop from issue to preview.

### 90-minute budget and cut line

Use the existing [README agenda](../README.md#agenda-and-expected-results) time bands. This is a planning budget, **not a timed rehearsal result**. Bot creation is live; account access, software installation, checkpoint availability, skills and isolated infrastructure are preflight work.

| Minutes | Priority | Observable result |
|---|---|---|
| 0–5 | Inspect the prepared starter | Correct repository, app, SHA and base checks |
| 5–12 | Create FDE, QA and DevOps | Three bounded roles; only the human merges |
| 12–20 | Approve the core design | Shared API/schema, files and tests agreed |
| 20–40 | Implement the small form/results exercise | Essential UI plus focused tests; QA starts independently as work becomes available |
| 40–55 | Run QA and inspect the PR/preview | Valid/invalid feedback, results and scoped evidence; DevOps reports checks/access |
| 55–70 | Review and decide | Human inspects the diff, independent findings and same-commit checks; request fixes if needed |
| 70–82 | Protect the recovery buffer | Finish core verification or explain a blocker; optional routine draft/showcase only if core evidence is ready |
| 82–90 | Questions and handoff | Known limits, next steps and optional practice |

**Cut line:** do not start detailed distribution/comments work, reference-layout recreation or the optional routine while core implementation, tests or review need time. The published 70–82 routine slot is conditional; recovery takes priority. If implementation exceeds its budget, switch to an identified, previously verified reference for explanation, record the unfinished exercise and continue the review lesson. Do not rush a merge or claim the exercise passed. Fresh-instance persistence and isolated preview evidence must be prepared/reviewed without weakening AC10; missing evidence stays BLOCKED.

## 3. Planned MVP stack

| Choice | Why |
|---|---|
| Next.js (App Router) | UI and API route handlers (BFF) live in one repo with one deploy. |
| TypeScript | One typed language from schema to UI. |
| Tailwind CSS 4 | Fast styling without a separate CSS layer. |
| shadcn/ui | Polished, accessible components that live in the repo. |
| lucide-react | Consistent icons, already used by shadcn/ui. |
| shadcn charts (Recharts) | The dashboard chart, the "wow" moment of the demo. |
| Zod | One shared schema validates both the form and the API. |
| Drizzle ORM + Neon Postgres (free tier) | Type-safe queries and simple migrations on serverless Postgres. |
| Vitest | Fast unit tests for validation and aggregation logic. |
| Playwright (1–2 e2e tests) | End-to-end evidence that the QA bot can point to. |
| GitHub Actions | Runs tests, `verify`, and Playwright on every PR. |
| Vercel | A preview URL per PR, and production on merge. |

Docker is optional and only for local development, because Vercel does not run containers. We left Nest.js out on purpose: the API is small, and a second framework would be one more thing to explain without adding value on stage.

## 4. The team: three Grok Bots and one human

The roles are inspired by [roadmap.sh](https://roadmap.sh), in particular the [Forward Deployed Engineer](https://roadmap.sh/forward-deployed-engineer) roadmap. The point of splitting the work is separation of concerns. The bot that builds is not the bot that judges, and neither of them merges.

The **FDE** runs the inception and implements the change end to end, then opens a PR. The **QA Engineer** judges the PR against the MVP acceptance criteria written here *before* the migration is implemented, not against the FDE's own report. Green CI is not acceptance. The QA bot owns the `verify` skill and the Playwright tests. The **DevOps Engineer** owns GitHub Actions and the Vercel previews and deploys. The **human tech lead** (the presenter) reviews, approves, and merges.

All three bots share five rules: never merge, use connectors first and the browser last, bring evidence for every claim, do one task per prompt, and never declare done without proof. The last rule is the pstack principle `principle-prove-it-works` (vendored in `.agents/skills/principle-prove-it-works`): before saying done, verify the real artifact (run the feature, read the actual value, inspect the diff), not a proxy, a self-report, or "it compiles"; script the check so a reviewer can re-run it; keep the artifact visible.

**FDE: draft instructions**
> You are the Forward Deployed Engineer for Talk Feedback. Read the issue and `docs/inception.md`, propose the change, then implement it end to end in TypeScript on a new branch and open a PR that explains what changed, why, and how to test it. Never push to main, never merge, never force-push. Use the GitHub connector, not the browser. Attach evidence (test output, preview URL). Before you say done, apply `principle-prove-it-works`: verify the real artifact with a re-runnable script, not "it compiles", and keep the output visible. One task, one prompt.

**QA Engineer: draft instructions**
> You are the QA Engineer for Talk Feedback. Judge each PR only against the acceptance criteria in `docs/inception.md`, not against the author's description. Green CI is not acceptance. First identify the tested commit and whether the PR changes the existing Fastify exercise or implements the planned MVP. On current main, run `npm run verify` locally: it starts its own localhost server and cannot target a preview URL. For the MVP, first implement and prove a separate preview-capable harness and Playwright configuration with an explicit target URL; do not claim preview coverage from the local verifier. Exercise the real form-to-dashboard journey and verify the persisted result. Report PASS, FAIL, WARN (AC9 coverage gaps only), or BLOCKED per applicable criterion with commands, target URL, outputs, and artifacts. Use `create-verification-skill` to generate a project-local verification skill that drives the preview and captures evidence; the checklist itself comes from the section 5 criteria. Before you report a verdict, apply `principle-prove-it-works`: re-run each check against its real target and quote what you observed: the real preview for the MVP; for the legacy Fastify track, the local `npm run verify` (its own localhost server, never a preview). Clean up only processes and test data created by the run, retaining evidence. Never merge. Connectors first, browser last. One task, one prompt.

**DevOps Engineer: draft instructions**
> You are the DevOps Engineer for Talk Feedback. Maintain the GitHub Actions workflow (tests, `verify`, Playwright) and the Vercel preview and production deploys. Report the preview URL and the CI status of each PR, with links. Keep secrets only in approved secret settings, never in repository files, command output, logs, evidence, or chat. Never ask anyone to paste a secret into chat or print its value; the presenter configures credentials through the provider’s secure settings. Verify configuration by presence or an authorized operation, with values redacted. Before you say CI or a preview is ready, apply `principle-prove-it-works`: open the real run and URL and report the status you observe now. Never merge. Connectors first, browser last. One task, one prompt.

## Skills per bot (from skills.sh)

Each bot loads only the skills needed for its task, because every skill it loads costs context. The FDE and DevOps bots take skills from [skills.sh](https://www.skills.sh). The QA bot also gets two pstack skills that already live in the repo.

| Bot | Skills |
|---|---|
| FDE | [shadcn](https://www.skills.sh/shadcn-ui/ui/shadcn), [vercel-react-best-practices](https://www.skills.sh/vercel-labs/agent-skills/vercel-react-best-practices), [neon-drizzle](https://www.skills.sh/neondatabase/ai-rules/neon-drizzle) |
| QA Engineer | [playwright-best-practices](https://www.skills.sh/currents-dev/playwright-best-practices-skill/playwright-best-practices), [playwright-cli](https://www.skills.sh/microsoft/playwright-cli/playwright-cli), plus pstack `create-verification-skill` and `interrogate` (already vendored; four skills, see the exception below) |
| DevOps Engineer | [deploy-to-vercel](https://www.skills.sh/vercel-labs/agent-skills/deploy-to-vercel), [ci-cd-and-automation](https://www.skills.sh/addyosmani/agent-skills/ci-cd-and-automation) |

The limit is three skills per bot. **Exception, decided by the presenter:** the QA bot keeps pstack `interrogate` as a fourth skill because it is part of pstack. All three bots also apply pstack `principle-prove-it-works` as their done-definition (no bot declares done without proof). It is a short principle that closes each delivery, loaded at that step, so it is not counted against the three-skill limit. `create-verification-skill` generates a project-local skill that drives the app and captures evidence; it does not build the checklist. The checklist comes from the section 5 criteria 1–10.

Use the official Zod and Drizzle documentation for schema and database details. Review any third-party skill before use: instructions to discover, print, log, or request token values in chat must not be followed. A skill recommendation never authorizes credential disclosure.

## 5. Current baseline and planned acceptance criteria

### Current Fastify workshop contract

Baseline: main at `e27be476632f14dd7296b21c0c209e064df49b9a` (PRs #2 and #4 merged). This documentation branch started before those merges; read the baseline files at that commit when comparing behavior.

- `POST /feedback` creates an in-memory record and returns `201`; `POST /api/feedback` is not implemented and returns `404`.
- `talkId`, `author`, and `comment` are required strings with minimum length 1; `comment` has maximum length 1000. Missing or empty values return `400`. Whitespace-only strings currently pass these length checks.
- `rating` is optional. When supplied, the schema accepts an integer from 1 to 5; omission still permits `201`. This is the existing exercise contract, not a required-rating form.
- These are schema constraints after Fastify’s default coercion: compatible primitive inputs can be converted (for example, JSON `rating: "5"` becomes numeric `5`, and numeric text fields become strings). The future strict Zod contract below intentionally changes this behavior and needs regression tests.
- Storage is in memory. The rating endpoint counts rated submissions and returns a two-decimal average (or `null` with count 0 when there are no ratings).
- `npm run verify` launches and tests its own localhost API. It does not accept a preview base URL. There is no Next.js form, Postgres persistence, or Playwright preview proof in this baseline.

### Next.js MVP target contract

The following are implementation requirements, not claims that the current API already passes. The migration must update routes, workshop prompts, API tests, and verification together. The two applications now coexist: root Fastify keeps `/feedback`, while the Next.js base in `mvp/` serves `/api/feedback`. This does not retire the legacy route or make it an alias in Next.js.

1. `POST /api/feedback` accepts required `talkId`, `author`, and `rating`, plus optional `comment`. Talk and author must remain non-empty after trimming. Accept omitted, empty, or whitespace-only comments and normalize them to `""`; supplied comments must be strings with at most 1000 characters after trimming. Save the normalized values in Postgres (including empty comment text in the existing NOT NULL column) and return `201` with those values. Verify the created contribution through the public GET API and/or dashboard, without direct database access.
2. A missing rating, a non-number, a non-integer, or a number below 1 or above 5 returns `400` with a field-specific validation message. Do not coerce API strings into numbers.
3. Missing, non-string, empty, or whitespace-only `talkId` or `author` returns `400` with field-specific messages. A supplied non-string comment (including `null`) or a comment exceeding 1000 characters after trimming also returns `400`. Omitted, empty and whitespace-only comments are valid and must not produce a required-field error. Rejected requests must not insert a row.
4. The form and API use the same Zod schema and show exactly the same field-level validation error text for the same invalid value; the form converts the rating control to a number before validation.
5. After a successful submission, the form shows a confirmation and resets. A rejected submission retains the input and displays the errors.
6. The dashboard lists every talk with feedback, showing its average rating rounded to one decimal (round half up: `4.25` → `4.3`) and submission count. Treat trimmed talk names case-insensitively: `Talk A` and `talk a` are one talk with a combined count and average. Every new MVP submission has a rating.
7. **Core exercise:** the dashboard chart shows one bar per grouped talk, with height equal to the displayed average rating and a readable label or tooltip showing that value. **Approved reference enhancement:** main instead uses a comparison table plus a selected-talk distribution with five bins for ratings 1–5 and exact counts from `/api/feedback/insights`; verify that chart against its counts. The reference does not need a second average-per-talk chart. Identify which target and SHA are being judged. The shared validation, grouped averages/counts, persistence and other applicable criteria remain unchanged; the insights endpoint/detail UI is not a prerequisite for the starter core.
8. With no data, the dashboard shows an empty state instead of an error.
9. Vitest covers the schema, normalization, and average calculation. Include missing, empty, whitespace-only, wrong-type, and boundary text cases, distinguishing required talk/author rejection from optional comment acceptance and normalization to `""`. Verify comment lengths after trim (0, 1, 1000 accepted; 1001 rejected) and non-string rejection including `null`; ratings omitted, 0, 1, 5, 6, fractional, and string-valued; valid creation and rejection without insertion; and the agreed old/new route behavior. Run these tests in CI. Report an AC9 coverage gap as WARN, not BLOCKED; retain the required cases and CI checks. WARN does not turn failing tests or failed CI into a pass.
10. Playwright e2e on the PR's actual preview URL submits the form, opens the dashboard, and verifies the new talk, average, and count. Include invalid submissions and the empty state in an isolated test dataset. Capture the actions and resulting state, and verify persistence after a fresh application instance against the same test database. A local-only pass does not satisfy this criterion.
11. After a successful submission, reload the page and verify that the new record is still visible through the dashboard/public GET API, including its talk, average, and count. This reload check complements, rather than replaces, AC10’s fresh-instance persistence check.
12. No secrets are committed to the repository. Verify this without printing secret values in logs, evidence, or chat; report findings with values redacted.

PR #9, which defined the shared acceptance refinements, is merged. The core/reference distinction above records the October 17 teaching-scope decision. Neither approved requirements nor merged code establish acceptance: QA must assess the tested target and commit against the applicable criteria, and missing isolated preview/persistence evidence remains BLOCKED.

Before accepting the MVP, the QA and DevOps bots must implement and execute the preview harness, CI workflow, and test-data setup/cleanup. Record the commit, target environment, observed results, and retained evidence; report missing preview access or infrastructure as BLOCKED rather than substituting a localhost pass.

## 6. Token-cost practices we teach

A public account by kaize ([post on X](https://x.com/0x_kaize/status/2110055685048209702)) describes how to stop burning through AI usage limits. We treat it as one practitioner's experience, not as measured data, but its advice fits the workshop well. We use **one bot per role**, so each context stays small and focused. We start a **fresh chat per task**, since the bot's role and rules live in its instructions, not in the chat history. We put the **whole task in one prompt** (what, where, context, expected result) instead of three fragmented messages. We prefer **connectors before the browser**, because driving a browser is the most expensive way to read GitHub. And we run **routines on a fixed, sparse schedule** (for example, once a day, "if there is nothing, answer in one line") rather than every few minutes.

## 7. Stage rule and known risks

The presenter’s October 15 decision supersedes the earlier restriction against implementing the full UI before the event. [spec.md](../spec.md) records the contract; [the issue index](issues/README.md) links the preparation, reference-app, slides and checkpoint deliveries. The acceptance refinements in [PR #9](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/9) are merged. The October 17 scope decision keeps the live exercise small and treats the approved reference's detailed insights as optional; it does not remove shared acceptance requirements.

Live time is too short for infrastructure. The approved delivery has two separate states: **a complete reference application on main**, including the form and dashboard, and **a frozen checkpoint/mvp-base for exercises**, retaining the deliberate feature gaps. Prepare, review and verify the reference before the event; only the human merges it. Verify the checkpoint independently and record its exact commit and gaps without moving its ref as part of documentation work. On stage, attendees create the bots and implement the exercises from that base, compare with the reference, verify their preview, and make the human approval decision. This document does not provision infrastructure or claim either state is already ready.

Two risks must be solved before the event, not on stage. First, **Vercel deployment protection** is on by default and blocks Playwright from reaching preview URLs. The fix is Vercel's *Protection Bypass for Automation* secret, stored as a GitHub Actions secret and never committed to files. Second, the **Neon `DATABASE_URL`** must exist only as an environment variable in Vercel and a secret in GitHub, never in the repository.

Playwright currently writes to the same Neon database used by previews and production. Every test must use a unique talk name (including a run-specific identifier) so its records can be identified independently. Never assume that shared storage is empty or reset it to test the empty state; AC8/AC10 empty-state checks require an isolated dataset/environment. Clean up only records created by the test run, preserving unrelated data. If isolation is unavailable, report the affected check as BLOCKED.

The Vercel and Neon accounts already exist and are linked to GitHub. The presenter must set `DATABASE_URL` as a Vercel environment variable and as a GitHub secret. It must never appear in files or in chat.

