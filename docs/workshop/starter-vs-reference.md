# Starter and reference checkpoint

The workshop starts from `checkpoint/mvp-base` at `d15eea431a214210160eb6e363945ef42b3fbcb8`.
The completed reference is `<reference-sha>` on branch `fde/issues-delivery`; fill the SHA placeholder in the PR.

| Capability | Starter | Reference |
| --- | --- | --- |
| Feedback and results routes | Absent | Present |
| Feedback form and dashboard | Absent | Present |
| Form/rating homepage text | Absent | Present |
| `test:e2e` | Absent | Present |
| API, schema, statistics, migration, UI primitives, `verify:http` | Present | Present |

## Clean starter checkout

These commands are copied from the starter README:

```sh
git fetch origin
git switch --detach d15eea431a214210160eb6e363945ef42b3fbcb8
git rev-parse HEAD
git switch -c exercise/feedback-ui
cd mvp
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run verify:http
```

From a reference checkout, compare both MVP directories:

```sh
node mvp/scripts/compare-checkpoint.mjs /path/to/starter/mvp --expect starter
cd mvp
npm run compare:checkpoint
```

See the [MVP README](../../mvp/README.md) and [preview QA instructions](../../mvp/PREVIEW_QA.md).
Current drafts: the #17 [guide](../speaker/guia-glaucia.md) and the #20
[slides](../speaker/slides/index.html) (both still under review in their issues).

## Nota em português

A lacuna do starter é o exercício, não um resultado verde de aceitação completa.
A aceitação remota/preview continua bloqueada até a issue #16.
