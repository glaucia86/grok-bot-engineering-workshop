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
npm install
npm run verify
```

The script (`verify.mjs`):
1. picks a free port and starts `src/server.ts`,
2. waits for `GET /health`,
3. runs each check and prints the curl command, status and body,
4. stops the server and exits `0` only if every check is PASS.

## Adding checks for a new feature
Add entries to `checks.extra.mjs` in this folder (same shape as the built-in checks).
A feature is not done until it has a check here.

## Output
Markdown evidence ending with `Result: N/N PASS`. Copy it verbatim into the PR.
