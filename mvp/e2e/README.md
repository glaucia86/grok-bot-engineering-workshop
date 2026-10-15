# Browser evidence boundaries

`npm run build` followed by `npx playwright test --config=playwright.config.ts`
starts its own loopback production server with `DATABASE_URL` explicitly blank.
The browser intercepts `/api/feedback` with per-test fixtures. These checks prove
visible form validation, failure retention, successful reset, dashboard rendering,
reload behavior against the fixture, and desktop/mobile layout. They do **not**
prove real API persistence, Neon, or deployed preview behavior. Real route-handler
and on-disk PostgreSQL adapter checks remain in `src/db/persistence.test.ts`.
Install the browser with `npx playwright install chromium` first.

The report is `playwright-report/index.html`; screenshots and failed-run traces
are in `test-results/`. The successful journey captures desktop and mobile images.
CI runs local browser checks after build and does not receive database secrets.

## Actual preview (issue #16)

Do not run remote write checks against the currently shared preview/production
database. First obtain an isolated preview dataset and explicit authorization for
the test writes and their lifecycle. Configure the preview's secure protection
access separately; do not print bypass tokens or include them in a target URL.

The separate `playwright.preview.config.ts` refuses to run unless all three are set:

- `MVP_PREVIEW_URL`: actual HTTPS PR preview origin, no embedded credentials.
- `MVP_PREVIEW_COMMIT`: exact 40-character tested commit SHA.
- `MVP_PREVIEW_ISOLATED_AUTHORIZED=true`: attestation that isolation and write
  authorization have been established, not an instruction to create credentials.

Then run `npx playwright test --config=playwright.preview.config.ts`. It uses the
real public form/API, unique talk names, and verifies the new contribution after
reload. It retains the created talk identifier for authorized environment cleanup;
it never deletes unrelated feedback. The isolated environment owner must retire
the dataset after retaining evidence. This harness alone does not provision that
environment or prove empty-state isolation/fresh-instance persistence. AC10 remains
BLOCKED until those preview-specific checks and lifecycle evidence are completed.
