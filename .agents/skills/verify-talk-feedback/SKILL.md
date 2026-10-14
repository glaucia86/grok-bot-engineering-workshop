---
name: verify-talk-feedback
description: Prove the Talk Feedback API works. Boots the server, calls every endpoint, and prints evidence (command, response, PASS/FAIL). Use before opening or approving any pull request in this repository.
---

# Verify Talk Feedback

## When to use
- After changing anything in `src/`.
- Before opening a pull request: paste the evidence into the PR body.
- When reviewing a pull request: run it yourself, do not trust pasted evidence.

## How
```sh
npm ci --engine-strict
npm run verify
```

Requires Node.js 24 LTS and the `curl` executable on PATH (`curl --version`). On Windows, use PowerShell 7.3+ for replaying the printed commands; the script invokes curl directly without a shell.

The script (`verify.mjs`):
1. picks a free port and starts `src/server.ts` in one owned Node process via `--import tsx`, setting `HOST=127.0.0.1` for local verification,
2. waits for its own server startup message and `GET /health` on `127.0.0.1`,
3. executes each check with curl (with a bounded request timeout) and prints the actual command, status and body,
4. waits for the server to stop in a `finally` block, including startup, request, and assertion failures, and exits `0` only if every check is PASS.

Required extra checks are imported before startup. A missing or broken `checks.extra.mjs` fails verification instead of silently dropping checks. `Server PID` identifies the process owned by this run; no unrelated process is killed.

## Adding checks for a new feature
Add entries to `checks.extra.mjs` in this folder (same shape as the built-in checks).
A feature is not done until it has a check here.

## Output
Markdown evidence ending with `Result: N/N PASS`. Copy it verbatim into the PR.
