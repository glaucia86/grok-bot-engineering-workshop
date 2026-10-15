# Inception: Talk Feedback MVP

## 1. Goal

This document frames the work for the live Packt workshop **"Build Your First Engineering Bot with Grok Bot"** (November 17, 9:00–10:30 AM ET). We will turn Talk Feedback into a small but real MVP. Ninety minutes is not much time, and the audience needs to *see* something happen, so every decision below favors a visible result: a form you can submit, a chart that moves, and a preview URL that appears on the pull request.

This defines the Next.js MVP reference application and its separate workshop exercise checkpoint, not the existing Fastify API. The acceptance criteria in section 5 apply to that migration; the current workshop exercise keeps its existing contract until the migration is implemented and verified. The 90-minute schedule agrees with both READMEs on main after PR #4.

## 2. MVP scope

The MVP has three parts. First, a **public feedback form** where anyone can submit a talk, an author, a comment, and a rating from 1 to 5. Second, a **talk dashboard** that shows the average rating and the number of submissions per talk as a chart. Third, **persistence in Postgres**, so the data is real and survives deploys.

We are leaving **login/auth, an admin area, and email notifications** out on purpose. Each one costs stage time and teaches nothing about engineering bots. A form, a chart, and a database are enough to show the full loop from issue to preview.

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

All three bots share four rules: never merge, use connectors first and the browser last, bring evidence for every claim, and do one task per prompt.

**FDE: draft instructions**
> You are the Forward Deployed Engineer for Talk Feedback. Read the issue and `docs/inception.md`, propose the change, then implement it end to end in TypeScript on a new branch and open a PR that explains what changed, why, and how to test it. Never push to main, never merge, never force-push. Use the GitHub connector, not the browser. Attach evidence (test output, preview URL). One task, one prompt.

**QA Engineer: draft instructions**
> You are the QA Engineer for Talk Feedback. Judge each PR only against the acceptance criteria in `docs/inception.md`, not against the author's description. Green CI is not acceptance. First identify the tested commit and whether the PR changes the existing Fastify exercise or implements the planned MVP. On current main, run `npm run verify` locally: it starts its own localhost server and cannot target a preview URL. For the MVP, first implement and prove a separate preview-capable harness and Playwright configuration with an explicit target URL; do not claim preview coverage from the local verifier. Exercise the real form-to-dashboard journey and verify the persisted result. Report PASS, FAIL, or BLOCKED per applicable criterion with commands, target URL, outputs, and artifacts. Clean up only processes and test data created by the run, retaining evidence. Never merge. Connectors first, browser last. One task, one prompt.

**DevOps Engineer: draft instructions**
> You are the DevOps Engineer for Talk Feedback. Maintain the GitHub Actions workflow (tests, `verify`, Playwright) and the Vercel preview and production deploys. Report the preview URL and the CI status of each PR, with links. Keep secrets only in approved secret settings, never in repository files, command output, logs, evidence, or chat. Never ask anyone to paste a secret into chat or print its value; the presenter configures credentials through the provider’s secure settings. Verify configuration by presence or an authorized operation, with values redacted. Never merge. Connectors first, browser last. One task, one prompt.

## Skills per bot (from skills.sh)

Each bot loads only the skills needed for its task, because every skill it loads costs context. The FDE and DevOps bots take skills from [skills.sh](https://www.skills.sh). The QA bot also gets two skills that already live in the repo.

| Bot | Skills |
|---|---|
| FDE | [shadcn](https://www.skills.sh/shadcn-ui/ui/shadcn), [vercel-react-best-practices](https://www.skills.sh/vercel-labs/agent-skills/vercel-react-best-practices), [neon-drizzle](https://www.skills.sh/neondatabase/ai-rules/neon-drizzle) |
| QA Engineer | [playwright-best-practices](https://www.skills.sh/currents-dev/playwright-best-practices-skill/playwright-best-practices), [playwright-cli](https://www.skills.sh/microsoft/playwright-cli/playwright-cli), plus pstack `create-verification-skill` and `interrogate` (already vendored) |
| DevOps Engineer | [deploy-to-vercel](https://www.skills.sh/vercel-labs/agent-skills/deploy-to-vercel), [ci-cd-and-automation](https://www.skills.sh/addyosmani/agent-skills/ci-cd-and-automation) |

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

1. `POST /api/feedback` accepts JSON with `talkId`, `author`, `comment`, and `rating`. Trim the three text fields; each is required and must remain non-empty after trimming. The trimmed comment must be at most 1000 characters. Save the normalized values in Postgres and return `201`.
2. A missing rating, a non-number, a non-integer, or a number below 1 or above 5 returns `400` with a field-specific validation message. Do not coerce API strings into numbers.
3. Missing, non-string, empty, or whitespace-only `talkId`, `author`, or `comment`, and comments above the length limit, return `400` with field-specific messages. Rejected requests must not insert a row.
4. The form and API use the same Zod schema and show matching field-level validation messages; the form converts the rating control to a number before validation.
5. After a successful submission, the form shows a confirmation and resets. A rejected submission retains the input and displays the errors.
6. The dashboard lists every talk with feedback, showing its average rating (one decimal) and submission count. Every new MVP submission has a rating.
7. The dashboard chart shows one bar per talk, with height equal to the displayed average rating.
8. With no data, the dashboard shows an empty state instead of an error.
9. Vitest covers the schema, normalization, and average calculation. Include missing, empty, whitespace-only, wrong-type, and boundary text cases; ratings omitted, 0, 1, 5, 6, fractional, and string-valued; valid creation and rejection without insertion; and the agreed old/new route behavior. Run these tests in CI.
10. Playwright e2e on the PR's actual preview URL submits the form, opens the dashboard, and verifies the new talk, average, and count. Include invalid submissions and the empty state in an isolated test dataset. Capture the actions and resulting state, and verify persistence after a fresh application instance against the same test database. A local-only pass does not satisfy this criterion.

Before accepting the MVP, the QA and DevOps bots must implement and execute the preview harness, CI workflow, and test-data setup/cleanup. Record the commit, target environment, observed results, and retained evidence; report missing preview access or infrastructure as BLOCKED rather than substituting a localhost pass.

## 6. Token-cost practices we teach

A public account by kaize ([post on X](https://x.com/0x_kaize/status/2110055685048209702)) describes how to stop burning through AI usage limits. We treat it as one practitioner's experience, not as measured data, but its advice fits the workshop well. We use **one bot per role**, so each context stays small and focused. We start a **fresh chat per task**, since the bot's role and rules live in its instructions, not in the chat history. We put the **whole task in one prompt** (what, where, context, expected result) instead of three fragmented messages. We prefer **connectors before the browser**, because driving a browser is the most expensive way to read GitHub. And we run **routines on a fixed, sparse schedule** (for example, once a day, "if there is nothing, answer in one line") rather than every few minutes.

## 7. Stage rule and known risks

The presenter’s October 15 decision supersedes the earlier restriction against implementing the full UI before the event. [spec.md](../spec.md) records the contract; [the issue index](issues/README.md) links the preparation, reference-app, slides and checkpoint deliveries. The acceptance refinements in [PR #9](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/9) remain a separate pending patch; this update does not duplicate them or declare them merged.

Live time is too short for infrastructure. The approved delivery has two separate states: **a complete reference application on main**, including the form and dashboard, and **a frozen checkpoint/mvp-base for exercises**, retaining the deliberate feature gaps. Prepare, review and verify the reference before the event; only the human merges it. Verify the checkpoint independently and record its exact commit and gaps without moving its ref as part of documentation work. On stage, attendees create the bots and implement the exercises from that base, compare with the reference, verify their preview, and make the human approval decision. This document does not provision infrastructure or claim either state is already ready.

Two risks must be solved before the event, not on stage. First, **Vercel deployment protection** is on by default and blocks Playwright from reaching preview URLs. The fix is Vercel's *Protection Bypass for Automation* secret, stored as a GitHub Actions secret and never committed to files. Second, the **Neon `DATABASE_URL`** must exist only as an environment variable in Vercel and a secret in GitHub, never in the repository.

The Vercel and Neon accounts already exist and are linked to GitHub. The presenter must set `DATABASE_URL` as a Vercel environment variable and as a GitHub secret. It must never appear in files or in chat.
