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

See [the opt-in preview run contract](../PREVIEW_QA.md) for all required
non-secret variables, target policy, write limits, evidence and remaining blocks.
Never run against the shared preview/production database. The remote configuration
is not executed automatically by CI and does not prove isolation or fresh-instance
persistence. The local transport regression uses two run-owned loopback servers;
it proves HTTP/redirect/popup/WebSocket containment, not remote acceptance.
