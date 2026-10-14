# Inception: Talk Feedback MVP

## 1. Goal

This document frames the work for the live Packt workshop **"Build Your First Engineering Bot with Grok Bot"** (November 17, 9:00–10:30 AM ET). We will turn Talk Feedback into a small but real MVP. Ninety minutes is not much time, and the audience needs to *see* something happen, so every decision below favors a visible result: a form you can submit, a chart that moves, and a preview URL that appears on the pull request.

This inception comes before any code. The acceptance criteria in section 5 are the contract the QA bot will judge against.

## 2. MVP scope

The MVP has three parts. First, a **public feedback form** where anyone can submit a talk, an author, a comment, and a rating from 1 to 5. Second, a **talk dashboard** that shows the average rating and the number of submissions per talk as a chart. Third, **persistence in Postgres**, so the data is real and survives deploys.

We are leaving **login/auth, an admin area, and email notifications** out on purpose. Each one costs stage time and teaches nothing about engineering bots. A form, a chart, and a database are enough to show the full loop from issue to preview.

## 3. Stack

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

The **FDE** runs the inception and implements the change end to end, then opens a PR. The **QA Engineer** judges the PR against the acceptance criteria written here *before* code existed, not against the FDE's own report. Green CI is not acceptance. The QA bot owns the `verify` skill and the Playwright tests. The **DevOps Engineer** owns GitHub Actions and the Vercel previews and deploys. The **human tech lead** (the presenter) reviews, approves, and merges.

All three bots share four rules: never merge, use connectors first and the browser last, bring evidence for every claim, and do one task per prompt.

**FDE: draft instructions**
> You are the Forward Deployed Engineer for Talk Feedback. Read the issue and `docs/inception.md`, propose the change, then implement it end to end in TypeScript on a new branch and open a PR that explains what changed, why, and how to test it. Never push to main, never merge, never force-push. Use the GitHub connector, not the browser. Attach evidence (test output, preview URL). One task, one prompt.

**QA Engineer: draft instructions**
> You are the QA Engineer for Talk Feedback. Judge each PR only against the acceptance criteria in `docs/inception.md`, not against the author's description. Green CI is not acceptance. Run `verify` and the Playwright tests against the preview URL, and answer PASS or FAIL per criterion, with evidence. Never merge. Connectors first, browser last. One task, one prompt.

**DevOps Engineer: draft instructions**
> You are the DevOps Engineer for Talk Feedback. Maintain the GitHub Actions workflow (tests, `verify`, Playwright) and the Vercel preview and production deploys. Report the preview URL and the CI status of each PR, with links. Keep secrets only in GitHub and Vercel settings, never in files. Never merge. Connectors first, browser last. One task, one prompt.

## 5. Acceptance criteria

1. `POST /api/feedback` with a valid talk, author, comment, and rating saves a row in Postgres and returns `201`.
2. A rating below 1, above 5, or not an integer is rejected with `400` and a validation message.
3. A missing talk or author is rejected with `400`.
4. The form shows the same validation errors as the API, because both use the same Zod schema.
5. After a successful submission, the form shows a confirmation and resets.
6. The dashboard lists every talk with feedback, showing its average rating (one decimal) and submission count.
7. The dashboard chart shows one bar per talk, with height equal to the average rating.
8. With no data, the dashboard shows an empty state instead of an error.
9. Vitest covers the schema and the average calculation, and all tests pass in CI.
10. Playwright e2e on the PR's preview URL: submit the form, open the dashboard, and see the new talk and count.

## 6. Token-cost practices we teach

A public account by kaize ([post on X](https://x.com/0x_kaize/status/2110055685048209702)) describes how to stop burning through AI usage limits. We treat it as one practitioner's experience, not as measured data, but its advice fits the workshop well. We use **one bot per role**, so each context stays small and focused. We start a **fresh chat per task**, since the bot's role and rules live in its instructions, not in the chat history. We put the **whole task in one prompt** (what, where, context, expected result) instead of three fragmented messages. We prefer **connectors before the browser**, because driving a browser is the most expensive way to read GitHub. And we run **routines on a fixed, sparse schedule** (for example, once a day, "if there is nothing, answer in one line") rather than every few minutes.

## 7. Stage rule and known risks

Live time is too short for infrastructure. So the database, the Vercel project, CI, and the base app all arrive ready in a **checkpoint branch**. On stage, attendees only create the bots, build one feature, verify it, approve it, and see the preview.

Two risks must be solved before the event, not on stage. First, **Vercel deployment protection** is on by default and blocks Playwright from reaching preview URLs. The fix is Vercel's *Protection Bypass for Automation* secret, stored as a GitHub Actions secret and never committed to files. Second, the **Neon `DATABASE_URL`** must exist only as an environment variable in Vercel and a secret in GitHub, never in the repository.
