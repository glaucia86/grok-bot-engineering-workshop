# Talk Feedback workshop technical specification

Status: draft for Glaucia's review. Updated 2026-10-14.
Repository: glaucia86/grok-bot-engineering-workshop (private).
Workshop: Build Your First Engineering Bot with Grok Bot, Packt, November 17, 2026, 09:00–10:30 ET / 11:00–12:30 America/Sao_Paulo.

## Problem statement

The presenter needs a useful, replicable feedback application and a reliable 90-minute English hands-on workshop. Preparation must leave infrastructure ready while preserving the form and dashboard as the live engineering exercise. Existing evidence proves parts of the base, not acceptance of the whole application. Agents need a shared specification that distinguishes observed behavior, approved changes, pending decisions and validation gaps.

## Sources and precedence

The inception is the scope baseline. This specification records approved refinements and does not silently rewrite it. Before acceptance, reconcile the inception through a reviewed documentation change. Latest explicit presenter decisions govern over earlier bot reports.
Observed main: dd464beb8fe3a0f950c93703393f1a78605e471b.
Reviewed MVP base: PR #7, commit 36fe5d5ce36ec39f2c7c4e621c8f4c8e134ece33.
Reviewed speaker materials: PR #6, commit 31af4c0eecc06e00880bc7dfa5b9255f2f9167d3.
Status snapshots are historical; recheck the tested SHA before accepting later changes.

## Solution and stage boundary

Prepare the Next.js API, migrations, database configuration, CI and preview verification before the workshop. During the workshop, create the FDE bot from scratch, create QA and DevOps from prepared instructions, approve a design, build the form/dashboard, inspect independent evidence and let the human approve and merge.
Use an isolated disposable UI prototype to select visual direction before implementation. Prototype data is memory-only and does not constitute production acceptance.
No recordings as fallback: the presenter explicitly rejected that preparation work. If technical failure prevents delivery, discuss rescheduling rather than promising a recorded substitute.

## Approved decisions

- Numeric integer rating 1–5 is required.
- Comment is optional; this changes the current strict base and must be reflected in validation, persistence, UI and tests.
- Use five selectable stars for the form, with accessible labels, keyboard operation and an explicit selected value.
- Equivalent talk names differing only in capitalization or extra whitespace belong to one talk.
- Average is displayed with one decimal; 4.25 becomes 4.3.
- Demonstration represents an event with multiple fictional talks, varied title lengths, different feedback counts and mixed ratings. Do not limit it to two talks.
- Evaluate externally observable behavior through the interface and public API on the actual preview. Do not use direct database inspection as acceptance proof.
- Version this specification and the slices document in doc-specs so other agents can continue. Do not ignore that folder.
- Glaucia reviews and performs every merge. No public release or production deployment without explicit authorization.

## User stories

1. As an attendee, I want to identify a talk so my feedback belongs to the intended session.
2. As an attendee, I want to choose 1–5 stars so I can rate quickly.
3. As an attendee, I want to submit without a comment so writing is not a barrier.
4. As an attendee, I want to add an optional suggestion so I can explain my rating.
5. As an attendee, I want field-specific errors so I can correct invalid input.
6. As an attendee, I want rejected submissions to retain input so I do not retype it.
7. As an attendee, I want successful submission confirmation and a reset form so I know it was saved.
8. As a keyboard user, I want operable star controls and visible focus so I can complete the flow.
9. As an organizer, I want one entry per equivalent talk name so spelling case and spaces do not split statistics.
10. As an organizer, I want average and count for each talk so I can compare feedback.
11. As an organizer, I want a legible chart with numeric labels or tooltips so values do not depend on visual estimation.
12. As an organizer, I want a useful empty state so I know what to do before feedback exists.
13. As an organizer, I want updated feedback after reload so the dashboard reflects persisted data.
14. As the presenter, I want realistic fictional fixtures so I can demonstrate density and variation.
15. As the presenter, I want a separate design prototype so selecting the look does not prebuild the live feature.
16. As QA, I want reproducible preview checks tied to a commit so evidence can be independently assessed.
17. As DevOps, I want preview access through secure automation settings so protection stays enabled.
18. As a participant, I want documented setup and migrations so I can replicate the application.
19. As an engineering agent, I want bounded slices and dependencies so I can work in a fresh context.
20. As the human lead, I want explicit approval boundaries so agents cannot merge or publish independently.

## Current state and gap analysis

| Area | Observed state | Remaining work |
| --- | --- | --- |
| Existing exercise | Root Fastify app, in-memory POST /feedback | Preserve contract; document coexistence |
| MVP base | Next.js 16, Tailwind 4, shadcn/chart, lucide, Zod, Drizzle/Neon | Review PR #7; human merge |
| Creation API | POST /api/feedback validates, inserts and returns 201 | Optional comment and shared normalization rules |
| Aggregation API | GET /api/feedback returns talkId, average, count | Case/whitespace-equivalent grouping |
| Schema | Required talkId, author, comment; integer rating 1–5 | Comment optional; regression coverage |
| UI | Next.js starter page | Star form, confirmation, dashboard, chart and states are live feature |
| Tests | Unit, handler and PGlite durability tests | Approved contract changes and actual preview journey |
| CI | 53 tests, lint, build, typecheck, 3 HTTP smoke checks passed for cited base | Preview-capable acceptance workflow and evidence |
| Deployment | Vercel check passed for cited base | Protection bypass and real journey unverified |
| Persistence | Local isolated database durability evidence | Actual Neon transport/environment proof through external behavior |
| Speaker materials | 20 slides, guide, 6 reserved captures | Visual inspection, real captures, removal of recordings, current branch prompts |
| Checkpoints | Older READMEs may reference automate-me | Inspect checkpoints and align native-routine instructions |

Vercel success does not prove application acceptance. PGlite does not prove Neon transport or remote deployment behavior. PR #6 does not contain the MVP directory; update it from main only after the human merges the base.

## Implementation decisions and contracts

Keep the existing Fastify exercise independent of the Next.js MVP. Do not alias or retire its /feedback route without an explicit compatibility decision.
The shared Zod schema remains the API/form validation source. Reject nonnumeric, fractional, missing and out-of-range ratings without coercing strings. Require trimmed nonempty talk/author strings. Keep the 1000-character limit for supplied trimmed comments.
Proposed optional-comment representation: omission, empty input and whitespace-only input mean no comment; reject nonstring supplied values. Choose nullable versus normalized empty storage during reviewed design, inspect the existing migration and retain backward compatibility. This representation is a proposal, not an already-approved schema change.
Define one canonical talk comparison rule: trim leading/trailing whitespace, collapse runs of internal whitespace, compare without capitalization differences. Do not infer accent removal or fuzzy matching. Preserve a readable title; settle which existing spelling is displayed in design. Do not merge distinct talks merely because of unrelated similarity.
Creation returns 201 with saved feedback. Validation returns 400 with field-specific errors and no insertion. Malformed JSON is a body-level error. Current GET shape is an array of talkId, average, count; document any shape change before implementation.
Display one-decimal averages, including whole values as e.g. 4.0. Chart heights correspond to the displayed average and each talk has a readable value/count. Keep a stable, documented ordering so comparisons do not jump unexpectedly.
Success confirms and resets; validation failure retains inputs. Pending submissions prevent accidental repeated activation. Retry must not claim idempotency unless implemented and tested.
Use the current Next.js/Tailwind/shadcn/lucide stack. Select the final visual hierarchy through Matt Pocock's prototype workflow and frontend-design guidance; no visual variant has been approved yet.

## Acceptance and testing decisions

- Valid star rating plus required fields and an omitted comment produces a saved record.
- Missing/wrong-type/whitespace-only required strings, supplied comments above the trimmed limit and invalid ratings are rejected with corresponding errors and no new submission.
- Form and API display equivalent field-validation messages for matching failures.
- Empty and whitespace-only comments can be submitted according to the reviewed representation.
- Equivalent names group together; counts and means reflect all relevant rated submissions.
- Two-decimal intermediate mean 4.25 displays 4.3; whole averages display one decimal.
- New submission updates observable statistics and remains visible after a fresh page reload.
- Star input supports keyboard access and clear value/focus; rating is not conveyed by color alone.
- Chart remains legible with multiple talks and long names; empty state directs the attendee to submit feedback.
- CI runs meaningful schema, aggregation, route and persistence regression coverage for the revised contract.
- Playwright targets the exact PR preview URL with isolated test data and retained screenshots/results. A localhost-only run does not satisfy preview acceptance.
- Invalid submission, valid submission, dashboard result, empty dataset and reload are exercised. A fresh application instance against the same dedicated test database supplies separate persistence evidence; reload alone does not prove a process restart.
- Observe saved feedback through API/UI rather than acceptance queries directly against the database.
- Repository review before public publication includes secret/history checks with redacted evidence; never put credentials in artifacts.

Use existing public HTTP/API and rendered UI boundaries as the highest practical testing seams. Existing handler and local durability tests supplement, not replace, them. Record commit, URL, command, output and retained artifact location.
The prior consolidated prompt requests AC9 be classified WARN rather than BLOCK. The precise advisory scope must be settled in the inception update; do not silently downgrade functional failures or required CI checks.

## Demo data and environment safety

Prepare deterministic fictional talks and feedback in a dedicated test environment; fixture count is configurable, not an unapproved performance target. Include high/low/mixed scores, sparse/dense counts, long titles and equivalent-name variants. A volume fixture checks correctness and usability, not production load capacity.
Preview and production may currently share a Neon database according to the handoff. Unique talk names do not by themselves provide database isolation or an empty dataset. Verify separation before enabling writes; leave real-data testing BLOCKED if no safe dedicated test environment exists.
Do not delete the pre-existing smoke-test record without explicit presenter approval. Cleanup only data/processes owned by an authorized run, preserving evidence. DATABASE_URL and protection bypass belong only in secure provider/CI settings. Keep Deployment Protection enabled.

## Workflow and dependencies

Review the base, await the human merge, then update the speaker branch from main and revalidate. Refine inception acceptance criteria through a separate reviewed PR. Prototype visual direction in a disposable branch without Neon mutations; preserve a context pointer and record the winning decision before cleanup. Do not merge prototype variants into main.
Use to-tickets next and create slices.md as the shared implementation map. One complete externally verifiable slice per fresh context; record blockers and evidence. Reuse existing PRs and check for duplicate issues before publishing new work.
Context targets are operational heuristics: aim for the user's Smart Zone (roughly 0–40%); plan handoff before roughly 55–60% rather than carrying an expanding history. Inspect actual context availability; these percentages are not model guarantees. Handoffs include exact commit, commands/results, decisions, unresolved blockers and the next bounded step.

## Out of scope

Authentication, admin area, email notifications, payments, unnecessary new frameworks, production load testing, AI features inside the demo, automatic merges, public release, production deployment and recorded fallback videos.
No personal or employer information. No activation of the workshop's daily routine: use a disabled draft and offline preview only.
Do not build the production form/dashboard before the live workshop as part of infrastructure readiness. A private disposable prototype is permitted.

## Remaining decisions and follow-through

- Pick the final UI variant after visual review.
- Select which QA skill is removed to honor the maximum of three; current guide suggests interrogation as a replacement rather than a fourth simultaneous skill.
- Resolve optional-comment storage/display spelling proposals in implementation design.
- Clarify AC9 warning policy and reconcile inception wording before complete MVP acceptance.
- Confirm isolated preview test database and secure bypass configuration.
- Confirm workshop visibility plan, speaker-material inclusion and external event times before publication.
- PR #2 was reported already merged, so do not plan an update to an open backup PR without checking.
- Removing recording fallback was requested; earlier handoff delivery was uncertain, and repository changes remain unconfirmed.

This document specifies future behavior. Publication of the draft is not implementation, test execution, acceptance or merge approval.
