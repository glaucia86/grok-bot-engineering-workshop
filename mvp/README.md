# Talk Feedback MVP reference application

Main contains the complete reference form, accessible five-star rating and talk dashboard, merged through PRs #26/#27. The separate `checkpoint/mvp-base` is the exercise starter: its homepage deliberately omits the form and dashboard. Follow the README at the instructor-approved checkpoint SHA for its supported base and pinned requirements. This reference implementation is available for comparison; remote acceptance still needs commit-specific isolated-preview evidence.

## Two independent applications

- Repository root: existing Fastify exercise, including `POST /feedback`, with
  its own package.json and in-memory storage. Run its commands from the root.
- `mvp/`: Next.js application, with `POST /api/feedback` and `GET /api/feedback`.
  Run the commands below from `mvp/`. `/feedback` is not an alias in Next.js.

This application does not retire or change the Fastify contract. Its root
`npm run verify` checks only its own localhost Fastify server, not this MVP or
any Vercel preview.

## Install and validate

Use Node.js 24 LTS and npm. From the repository root:

```sh
cd mvp
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run verify:http
```

No database credentials are needed for these checks. `typecheck` generates the
Next.js route types first, so it also works before the first build.

### What the tests prove

- Schema and statistics unit tests cover validation, normalization and averages.
- Route tests invoke the actual Next.js handlers and mock the database boundary.
  They verify responses, normalized insert values, rejection without insertion,
  empty results and database error propagation.
- Persistence tests apply the committed SQL migration to an isolated, on-disk
  PGlite database (embedded PostgreSQL), exercise the actual handlers through
  Drizzle's PGlite adapter, then close and reopen the database to check durability.
  Temporary databases are removed after each test. They never use DATABASE_URL.

PGlite tests are real local database tests with a substituted database adapter;
they do **not** validate the production Neon HTTP transport, remote Neon schema,
or deployed Vercel environment. Mocked route tests do not prove persistence.

- `npm run verify:http` starts its own production server after a build, checks
  the homepage, `/feedback` and `/results` 200, and invalid `/api/feedback` 400 over real
  HTTP with DATABASE_URL explicitly blanked, then stops only its owned process. It does not
  submit valid data or test remote persistence.

The `MVP validation` GitHub Actions workflow runs clean install, tests, lint,
build, type checking and HTTP smoke checks for MVP changes, with read-only repository permission
and no application secrets. Vercel's deployment check is separate from this
workflow and from acceptance testing.

## Configure a development database

Use a dedicated development Neon database or branch, separate from production.
Obtain its connection string in the provider's secure console. Set the
`DATABASE_URL` environment variable in your local shell/session or an approved
secret manager. Never paste its value in chat, commit it, or include it in logs.
The production adapter uses Neon HTTP; an ordinary local PostgreSQL URL alone
is not a drop-in replacement for that transport.

Next.js also loads `mvp/.env.local` for local app runs. If you use that mechanism,
keep the file local and ignored by Git. Its shape is:

```dotenv
DATABASE_URL=<your-development-Neon-connection-string>
```

The placeholder is not a working credential. `drizzle.config.ts` reads the
process environment directly and does **not** load `.env.local`. For migrations,
provide DATABASE_URL through the shell/secret manager too. Do not expect a
working dev server's `.env.local` alone to configure the migration command.

### Apply migrations before using the API

Confirm that the selected DATABASE_URL belongs to the intended development
branch, then run from `mvp/`:

```sh
npm run db:migrate
npm run dev
```

Open http://localhost:3000. A successful homepage or build does not prove the
database is configured. A valid POST or GET needs DATABASE_URL and the migrated
`feedback` table; missing configuration or database failures produce a server
error. Invalid payloads are rejected before accessing the database.

After changing `src/db/schema.ts`, use `npm run db:generate`, review and commit
the resulting SQL and metadata, then apply the migration to the intended test
or development database. Builds do not automatically run migrations. Coordinate
production migrations separately; do not point tests at production.

## API contract

`POST /api/feedback` requires `talkId`, `author` and `rating`; `comment` is optional.
Talk and author are trimmed and must remain nonempty. Omitted, empty or
whitespace-only comments are accepted and normalized to `""` in the 201 response
and storage, preserving the existing NOT NULL column. A supplied comment must be
a string (not `null`) and contain at most 1000 characters after trimming; invalid
types and oversized comments return 400. Rating must be a numeric integer from
1 to 5; strings are not coerced. Valid input returns 201 with the stored record. Invalid input
returns 400 with an `errors` map and does not insert a row. Malformed JSON has a
body-level error.

`GET /api/feedback` returns an array of `{ talkId, average, count }`, with each
average rounded to one decimal and an empty array when there is no feedback.
Talk IDs are grouped case-insensitively (`Talk A` and `talk a` are one talk).
The summary retains the spelling of the first row encountered for each group;
the database query does not promise a particular row order. Stored feedback and
POST responses keep the original trimmed spelling. Only the grouping key is
lowercased; accents, punctuation and internal whitespace remain significant.
A JSON number such as `3` can be displayed as `3.0` by the dashboard.

## Vercel preview and remaining acceptance work

The Vercel project root must be `mvp`. Configure DATABASE_URL in Vercel's secure
environment settings for the intended environment, and apply the migration to
that environment's database before exercising its API. Keep preview/test data
isolated from production. Never put secrets in repository files or PR comments.

A Ready deployment proves a successful deployment, not the full feedback flow.
Preview protection may return a Vercel sign-in redirect. An authorized automation
bypass must be configured through secure provider/CI settings before unattended
preview tests; do not disable protection or expose a token to work around it.

Before accepting the complete reference MVP, run
Playwright against the actual PR preview using an isolated test dataset. Verify
valid and invalid submissions, chart/empty states, and persistence after a fresh
application instance, and clean up only data created by that run. Record the
commit, target URL and observed results. Until then, report preview and remote
persistence verification as unverified or blocked, not as a localhost pass.
