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

Only this project's immutable host shape is supported:
`grok-bot-workshop-mvp-<9 lowercase letters/digits>-glaucia86s-projects.vercel.app`.
Known production aliases/custom domains, moving branch aliases, localhost/IPs and URLs carrying
credentials are rejected. Supporting another host requires a reviewed policy
change, not disabling the check. The ID, SHA and authorization flag are operator
attestations; the harness cannot prove the Vercel-to-Neon binding or deployed SHA.

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

Still **BLOCKED / not implemented here**: provider provisioning and isolation
verification, secure protected-preview access, actual remote execution and
commit verification, fresh application instance against the same QA database,
authorized cleanup, and a protected opt-in remote CI job. Reload is not fresh
instance proof. Issue #16 remains open; this patch provides safer preparation only.
