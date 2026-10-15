<a id="top"></a>
<div align="center">

<img src="assets/banner.webp" alt="Build Your First Engineering Bot with Grok Bot — Packt workshop banner" width="100%" />

# Build Your First Engineering Bot Team with Grok Bot

**A hands-on Packt workshop · November 17, 2026 · 9:00–10:30 AM ET (11h–12h30 Brasília) · 90 minutes**

<p>
<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img alt="Node.js 24 LTS" src="https://img.shields.io/badge/Node.js-24%20LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
<img alt="Fastify" src="https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white" />
<img alt="Vitest" src="https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" />
<img alt="Hands-on" src="https://img.shields.io/badge/Format-Hands--on-F97316?style=for-the-badge" />
<img alt="MIT" src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />
</p>

English · [Português (Brasil)](README.pt-br.md)

</div>

## Main track: Next.js Talk Feedback MVP

Prepare a **complete reference application on main** before the event, through reviewed PRs and human merges. In the **90-minute workshop**, participants implement the form/dashboard exercises from the separate frozen `checkpoint/mvp-base` API/database base in `mvp/`. The root Fastify app is **optional extra practice**, not the main workshop path.

Start with [spec.md](spec.md), [inception](docs/inception.md), [MVP setup](mvp/README.md), and the [exercise and GitHub issue index](docs/issues/README.md). The spec is the technical contract; GitHub issues track work, rather than duplicating that plan in another spec or slices file.

### State before the workshop

The base API, schema, migration, local tests and UI primitives are merged. The homepage is still a starter page; the form/dashboard and real-preview acceptance remain work to do. The target is a complete reference app on main; this snapshot is not there yet. The merged spec records approved requirements, not a passing application.

As of October 15, [PR #9](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/9) (acceptance refinements) and [PR #10](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/10) (case-insensitive talk grouping) are still pending human merge. Recheck their state and the tested SHA before the event. Keep MVP acceptance BLOCKED until the criteria are merged and verified.

## Agenda and expected results

| Minutes | Activity | Observable result |
|---|---|---|
| 0–5 | Inspect the prepared MVP base | Correct repository, app, commit and checks |
| 5–12 | Create FDE, QA and DevOps roles | Three bounded roles; only the human merges |
| 12–20 | Review the live-feature design | Files, public contracts and tests agreed |
| 20–40 | Build and verify | Form/dashboard implementation and criterion evidence |
| 40–55 | Inspect PR and preview | Submit feedback and inspect the dashboard |
| 55–70 | Human review and decision | Approve/merge personally or request changes |
| 70–82 | Draft native daily triage | Disabled definition and private sample output |
| 82–90 | Q&A | Review lessons and optional extra practice |

The [presenter guide](docs/speaker/guia-glaucia.md) gives the corresponding 11:00–12:30 Brasília run sheet. Infrastructure preparation happens **before** the event, not in these 90 minutes.

## Before the event

1. Prepare GitHub access and an authorized workshop repository/fork. Check visibility and access before sharing a private repository.
2. Use Node.js 24 and npm for local checks. Follow [MVP setup and migrations](mvp/README.md); run MVP commands from `mvp/`, not the repository root.
3. Prepare the intended database, migration, Vercel root `mvp`, secure preview access, test-data isolation and preview harness. A configured secret or Ready deployment alone is not evidence that the journey works.
4. Use the reviewed complete main application as the reference and freeze a separately verified `checkpoint/mvp-base` revision for exercises. Do not move that checkpoint to the complete app or assume it contains later fixes. The numbered `checkpoint/01`–`05` branches belong to the Fastify extra exercise.
5. Rehearse with a dedicated test dataset. Give every run a unique talk identifier; this does not make a shared Neon database isolated. Never empty shared storage to demonstrate an empty dashboard. Clean up only records/processes created by the authorized run. Missing access or isolation is BLOCKED.
6. Keep credentials in secure settings; never paste values in chat, source, logs or evidence. No account/secret configuration is authorized merely by reading this guide.

Local base checks (no database credentials required):

```sh
cd mvp
npm ci
npm test
npm run lint
npm run build
npm run typecheck
npm run verify:http
```

These checks prove only their stated local scope. `verify:http` rejects invalid input on its own localhost server; it does not target a Vercel preview or verify a valid remote write. Root `npm run verify` checks the separate Fastify app.

## Team and workshop prompts

Load at most three skills per bot:

- FDE: `shadcn`, `vercel-react-best-practices`, `neon-drizzle`
- QA: `playwright-best-practices`, `playwright-cli`, `create-verification-skill`
- DevOps: `deploy-to-vercel`, `ci-cd-and-automation`

FDE builds; QA independently evaluates the criteria; DevOps reports checks and preview. No bot approves or merges. Use one task per prompt and attach commit-specific evidence.

### 1. Inspect and design (0–20 min)

```text
Read spec.md, docs/inception.md, mvp/README.md and the selected GitHub issue.
Identify the exact base commit and distinguish the Next.js MVP from the root Fastify exercise.
Use the complete reference app on main for comparison and the frozen checkpoint/mvp-base for exercises.
Design the assigned form/dashboard exercise using the existing schema, API and UI primitives.
Show files to change and observable tests. Keep comment required (trimmed 1–1000), rating integer 1–5,
and one-decimal averages (4.25 → 4.3). Group Talk A/talk a together under the approved contract.
List unresolved prerequisites separately. Do not change code until I approve the design. Never merge.
```

### 2. Implement after design approval (20–40 min)

```text
Implement the approved exercise design on a new branch from the frozen reviewed checkpoint commit.
Before opening the exercise PR, identify its instructor-approved exercise repository and target branch.
Do not target the canonical reference main or move checkpoint/mvp-base; stop if that destination is unspecified.
Keep the complete reference main separate; do not overwrite it with an exercise checkpoint.
Use the existing shared validation and API. Keep successful confirmation/reset and rejected-input retention.
Show every talk's average and count, one bar per talk, a readable value label/tooltip, and the empty state.
Run the applicable MVP tests, lint, build, typecheck and HTTP checks. Open one PR with evidence.
Do not claim preview acceptance from local checks. Do not merge or change production settings.
```

### 3. Independent QA and preview (20–55 min)

```text
Use spec.md and the merged acceptance criteria, not the author's report, to assess this PR.
First identify the tested SHA and actual preview URL. Check the real form → API → dashboard/GET journey.
Compare exact API/form error messages. Verify creation through public results, reload persistence,
and separately persistence after a fresh application instance against the same isolated test database.
Use unique test talk names; do not reset shared Neon data. Empty-state checks require isolated data.
Report PASS, FAIL, WARN only for AC9 coverage gaps, or BLOCKED per criterion, with commands and artifacts.
Failing tests or CI remain failures. Missing criteria merge, preview access or isolation stays BLOCKED.
Clean up only authorized run-owned data/processes, keeping evidence. Never merge.
```

### 4. Human decision (55–70 min)

Read the change, independent QA evidence and checks for the same commit. Green CI is not acceptance. Only the human approves and merges. Record advisory coverage gaps without converting failures or missing evidence into passes.

### 5. Native routine draft (70–82 min)

```text
Read docs/routines/daily-triage.md. Draft a native Grok Bot routine for weekdays at 9 AM America/Sao_Paulo.
Use its private delivery and read-only rules. Propose labels; do not apply them.
Show a disabled definition and sample summary. Do not create or enable a scheduled task in this exercise.
```

## Optional extra practice: legacy Fastify

The original in-memory API and its exercises remain available. They are **not** the Next.js contract and are not prerequisites for the live UI feature.

- [Talk rating](docs/issues/01-add-talk-rating.md): optional rating in the old exercise; [historical design](docs/design/talk-rating.md). Rating is already implemented on current main, so use the exercise's earlier checkpoint when practicing implementation.
- [Delete feedback](docs/issues/02-delete-feedback.md) and [feedback summary](docs/issues/03-feedback-summary.md): optional Fastify extensions, not MVP requirements or remote test cleanup mechanisms.
- Root commands: `npm ci`, `npm test`, `npm run typecheck`, `npm run verify`.
- The historical `checkpoint/01-setup`, `02-design`, `03-verification`, `04-backup-pr`, and `05-routine` branches capture stages of this extra exercise. Do not merge them wholesale into main or use them as the MVP base.
- Fastify uses `/feedback`, optional rating and in-memory persistence; the MVP uses `/api/feedback`, required rating/comment and Postgres. Never substitute one verifier's evidence for the other.

<a id="credits"></a>
## Credits and further reading

- **pstack** by Lauren Tan ([@poteto](https://x.com/poteto)): the skills in [`.agents/skills`](.agents/skills) are copied from [cursor/plugins/pstack](https://github.com/cursor/plugins/tree/1e5c90a4b6f249917bd21fe361b3a2a7deb741b8/pstack) under the MIT license. See [NOTICE](.agents/skills/NOTICE.md) and [LICENSE](.agents/skills/LICENSE). The *build the lever* idea is hers.
- **Further reading:** Matt Pocock's [mattpocock/skills](https://github.com/mattpocock/skills) (MIT), another collection of agent skills. Its `to-spec` workflow informed [spec.md](spec.md); it does not replace the three QA skills.

## License

Original workshop code and text: [MIT](LICENSE), © 2026 Glaucia Lemos. Third-party skills keep their own license (see above).

---

<a id="creator"></a>
## About the presenter

<div align="center">
<a href="https://github.com/glaucia86"><img src="https://avatars.githubusercontent.com/u/1631477?v=4" width="170" height="170" alt="Glaucia Lemos" /></a>

<h3>Glaucia Lemos</h3>
<p><strong>Principal Software Engineer · Author</strong></p>
<p>I work with AI and software engineering, building applications and exploring<br>AI coding agents with JavaScript and TypeScript. I share practical knowledge<br>through open-source projects, talks, and technical content.</p>

<p>
<a href="https://www.youtube.com/user/l32759"><img alt="YouTube" src="https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" /></a>
<a href="https://www.linkedin.com/in/glaucialemos/"><img alt="LinkedIn" src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge" /></a>
<a href="https://x.com/glaucia_lemos86"><img alt="X" src="https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white" /></a>
</p>
<p>
<a href="https://github.com/glaucia86"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" /></a>
<a href="https://www.twitch.tv/glaucia_lemos86"><img alt="Twitch" src="https://img.shields.io/badge/Twitch-9146FF?style=for-the-badge&logo=twitch&logoColor=white" /></a>
<a href="https://dev.to/glaucia86"><img alt="DEV Community" src="https://img.shields.io/badge/DEV_Community-0A0A0A?style=for-the-badge&logo=devdotto&logoColor=white" /></a>
</p>
<p><a href="https://linktr.ee/glaucia_lemos86">Linktree</a> · <a href="#top">↑ Back to top</a></p>
<p><strong>The bot proposes. The human approves.</strong></p>
</div>
