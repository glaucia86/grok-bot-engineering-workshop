# Opt-in preview harness — issue #16 preparation

`npm run test:e2e:preview` is a **remote write operation**, never part of the
automatic local CI workflow. No preview run was performed while preparing this
harness. Local policy/fixture tests do not establish preview acceptance.

Before running, an authorized operator must independently verify all of these:

- The exact immutable Vercel deployment URL belongs to the PR and deployed SHA.
- Its `DATABASE_URL` points exclusively to an empty QA database, migrated from
  this repository, with no production binding/data or other run using it.
- Up to four synthetic POST requests (one expected row; invalid requests could
  insert if the application regresses) and the QA lifecycle/cleanup are authorized.
  There is no public delete endpoint and this test deletes nothing.
- Preview access is available. Protection redirects/401/403 mean **BLOCKED**;
  this harness adds no bypass token support or protection changes.

Set these non-secret environment variables through the runner environment:

| Variable | Value |
| --- | --- |
| `MVP_PREVIEW_URL` | Exact HTTPS deployment origin, no path/query/fragment/credentials |
| `MVP_PREVIEW_COMMIT` | Full 40-character tested Git SHA |
| `MVP_PREVIEW_QA_DATABASE_ID` | Non-secret QA resource ID (letters, numbers, `_`, `-`; never a connection string) |
| `MVP_PREVIEW_ISOLATED_AUTHORIZED` | `true`, only after the checks and write authorization above |

The full project-name host shape remains supported:
`grok-bot-workshop-mvp-<9 lowercase letters/digits>-glaucia86s-projects.vercel.app`.
Vercel also emits shortened `grok-bot-workshop-...` hosts for this project.
That prefix is **not** wildcarded: production deployments use it too, and a
shortened name alone cannot establish project identity. Instead, the shared local/CI
validator has this exact reviewed host/SHA routing exception:

| Immutable hostname | Required commit |
| --- | --- |
| `grok-bot-workshop-bpxtrs2fd-glaucia86s-projects.vercel.app` | `70c732f6ea070cc413e1cb1fc91fb352d705e835` |

Read-only [Vercel deployment metadata](https://vercel.com/glaucia86s-projects/grok-bot-workshop-mvp/E5tF5ShZckYVw88n8xuhNzGXAVS1)
was checked on 2026-10-17: project `prj_Q2YoezuOHO6ctl8NCdoHn3DcWqDS`
(`grok-bot-workshop-mvp`), deployment `dpl_E5tF5ShZckYVw88n8xuhNzGXAVS1`,
repository `glaucia86/grok-bot-engineering-workshop`, the SHA above and a non-production
target (`null`). The pin does not prove current preview status or database isolation
and does not authorize running against that deployment. Recheck the prerequisites
above before every run, including whether a previously reviewed deployment was promoted.

An unlisted shortened host or a different SHA is blocked, even when CI dispatch
and approved configuration agree. For a future shortened deployment, independently
read its provider metadata and verify the exact project ID, repository, deployment
hostname, commit and non-production target; then add its exact host/SHA pair to
`reviewedDeploymentCommits` with regression tests in a reviewed policy change.
Do not replace this bounded list with a prefix wildcard or disable the check.

Known production aliases/custom domains, moving branch aliases, localhost/IPs and URLs
carrying credentials are rejected. Supply the canonical lowercase HTTPS origin with
at most one trailing `/`; whitespace, encoded hostnames, dot paths, backslashes and
explicit ports (including `:443`) are rejected instead of silently normalized.
The ID, SHA and authorization flag remain operator attestations; the harness cannot
prove the Vercel-to-Neon binding or deployed SHA.

The journey confines browser traffic (including popups) to that origin and disables
service workers and WebSockets. Browser transport and API requests do not follow HTTP redirects.
The immutable hostname format alone does not distinguish preview from production
deployments; the external preview/isolation checks above remain mandatory.
Before writes, GET must return an empty
array and the UI must show the empty state. It sends three invalid API requests
(string rating, blank author, oversized comment), confirms field errors and no
aggregate contribution, then submits one normalized form record under a random
UUID talk. It checks the 201 response, confirmation, dashboard and GET after reload.
Retries are disabled to bound writes. An interrupted run may still create a row;
retain the initial run manifest for the authorized QA lifecycle owner.

Remote traces, screenshots and videos are disabled. The list reporter is console
output, not attachment storage. Curated files are written under
`mvp/preview-evidence/<run UUID>/` when invoked from `mvp/`:

- `manifest.json` is awaited before the journey starts. It records the UUID/talk,
  validated target/SHA/resource ID, planned request bounds and pending cleanup.
  If storage fails, no journey requests start.
- `outcome.json` records success or failure, a fixed phase, attempted POST count
  and, only after verification succeeds, the observed summary. It never records
  raw errors, responses, headers, credentials or environment variables. An attempted
  POST may have persisted even when its response or a later assertion fails.

These files are independent of the reporter and Playwright's output directory;
later runs create new UUID directories without deleting earlier cleanup evidence.
Automatic Playwright per-test output (including uncurated failure context) is discarded.
The runner may retain status-only `.last-run.json`; that is not cleanup evidence.
Missing or invalid outcome JSON means incomplete/interrupted execution or evidence-storage failure,
never success; the initial manifest still identifies the run for its authorized
lifecycle owner. An abrupt process termination cannot guarantee a final outcome.
Preserve these files securely until that owner completes authorized QA cleanup;
this harness neither deletes records nor claims cleanup is complete.

Do not introduce credentials
into URLs, test data, reporter configuration or artifacts. Review failure output
before sharing it; never upload provider responses or environment dumps.

## Manually dispatched CI (disabled until approved configuration exists)

`.github/workflows/mvp-preview-qa.yml` is separate from automatic local CI. It
has only `workflow_dispatch`, runs on main, queues runs serially without canceling
an active journey, and uses the named GitHub environment `mvp-preview-qa`.
Its runner reuses the same guarded Playwright harness; it does not provision a
database, migrate it, change deployments or supply a protection bypass.

Before enabling or dispatching, an authorized operator must prove the provider
isolation/binding, immutable deployment SHA, empty migrated QA dataset and write
authorization listed above. Configure environment protection with required human
reviewers and deployment branches restricted to main. If the repository/plan
cannot enforce that protection, keep this workflow disabled and report BLOCKED.
This change does not create/configure that environment, protection or credentials.

Only after verification, set these **non-secret environment-scoped variables**:

| Variable | Meaning |
| --- | --- |
| `MVP_PREVIEW_QA_ENABLED` | Exact `true`; leave absent until prerequisites are proven |
| `MVP_PREVIEW_APPROVED_URL` | Independently verified immutable preview origin |
| `MVP_PREVIEW_APPROVED_COMMIT` | Full deployed SHA verified for that origin |
| `MVP_PREVIEW_APPROVED_QA_DATABASE_ID` | Non-secret resource ID of its isolated QA database |

Do not put these in repository-wide variables as a substitute for the protected
environment. Do not enter a connection string, token or credential into inputs,
variables, source or logs. No `DATABASE_URL` or provider secret is needed by the
runner, because the deployed preview owns its already verified database binding.

Dispatch inputs are read inside the runner from `GITHUB_EVENT_PATH`, validated
without printing them, and passed to Playwright only after approval matching.
They are never interpolated into workflow `env`/`run` or exported to `GITHUB_ENV`.
This avoids step-header disclosure; dispatch inputs are still not a secret store.

Dispatch **from main** with the matching non-secret preview URL, full deployed
SHA and QA resource ID, and explicitly confirm `isolated_authorized`. Missing,
disabled or mismatched approved configuration fails before browser installation
and before any preview request. Non-main dispatches skip the job; the runner also
rejects non-main/non-manual contexts. The environment reviewer must independently
check the dispatch and target before approving. The gate compares attestations;
it cannot inspect Neon/Vercel or prove isolation, plan protection or deployed SHA.
Changing the target needs fresh external verification and environment approval.

The job checks out its trusted main workflow revision, not the input deployment
SHA. The latter identifies the externally verified preview under test; it is not
executed as workflow source. The run records both through normal GitHub run
metadata and the curated target manifest. Gate tests run offline in normal CI;
passing them is not authorization to dispatch the remote job.

The artifact step runs even after journey failure and uploads **only**
`preview-evidence/*/manifest.json` and `outcome.json`, using a run/attempt-specific
artifact name and seven-day retention. It does not upload traces, screenshots,
raw Playwright output directories or provider responses. Download and retain the
curated cleanup IDs before expiry until authorized cleanup is complete. Timeout
or abrupt runner loss can prevent upload; a green deployment or missing artifact
is not successful acceptance. No retries or cleanup operations are added.

Still **BLOCKED / not implemented here**: provider provisioning and isolation
verification, secure protected-preview access, actual remote execution and
commit verification, fresh application instance against the same QA database,
authorized cleanup, and configuration/approval of the protected CI environment.
Reload is not fresh instance proof. No remote workflow was dispatched while
implementing this integration. Issue #16 remains open; local tests and a workflow
definition are preparation, not remote acceptance.
