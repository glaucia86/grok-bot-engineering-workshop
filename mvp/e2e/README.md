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

The workshop has three browser destinations: `/` presents the workshop,
`/feedback` contains the form, and `/results` loads the dashboard. Navigation
checks cover direct entry, reload, active links, skip focus and browser history.
Saving stays on `/feedback` until the attendee chooses **View results**. The
journey fixture retains synthetic rows across navigation and reload; it is not
evidence of database persistence. The optional preview suite follows these routes
but remains opt-in and must never be run without its existing authorization.

The former combined-page browser checks for save-triggered refresh races and
independent simultaneous form/results retries no longer represent the product
flow. Request supersession and stale-refresh behavior remain covered by
`feedback-dashboard.test.tsx`. Browser coverage instead checks pending GET on
results entry, retrieval failure without fabricated empty/data states, keyboard
retry, and a saved fixture contribution becoming visible after explicit navigation.

## Actual preview (issue #16)

See [the opt-in preview run contract](../PREVIEW_QA.md) for all required
non-secret variables, target policy, write limits, evidence and remaining blocks.
Never run against the shared preview/production database. The remote configuration
is not executed automatically by CI and does not prove isolation or fresh-instance
persistence. The local transport regression uses two run-owned loopback servers;
it proves HTTP/redirect/popup/WebSocket containment, not remote acceptance.
