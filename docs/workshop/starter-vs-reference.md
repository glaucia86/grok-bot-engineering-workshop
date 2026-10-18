# Starter and reference checkpoint

The reviewed workshop starter is `checkpoint/mvp-base` at
[`d25831759530d4e4a1a022bb85d670e2f0964287`](https://github.com/glaucia86/grok-bot-engineering-workshop/commit/d25831759530d4e4a1a022bb85d670e2f0964287),
recorded in [issue #21's starter handoff](https://github.com/glaucia86/grok-bot-engineering-workshop/issues/21#issuecomment-6206554790).
The checkpoint ref must remain frozen; this guide does not move it.
The completed reference is [`341de005662906e3c3ce46d45e12461e45c24a55`](https://github.com/glaucia86/grok-bot-engineering-workshop/commit/341de005662906e3c3ce46d45e12461e45c24a55) (`main` after PR #46; this guide is added on top).

| Capability | Starter | Reference |
| --- | --- | --- |
| Feedback and results routes | Absent | Present |
| Feedback form and dashboard | Absent | Present |
| Form/rating homepage text | Absent | Present |
| `test:e2e` | Absent | Present |
| API, schema, statistics, migration, UI primitives, `verify:http` | Present | Present |

## Clean starter checkout

Use Node.js 24 LTS and npm in the authorized exercise repository/fork. First run:

```sh
git ls-remote --exit-code --heads origin refs/heads/checkpoint/mvp-base
```

Expect exactly `d25831759530d4e4a1a022bb85d670e2f0964287` followed by
`refs/heads/checkpoint/mvp-base`. If the ref is absent, inaccessible or different,
stop and resolve it with the instructor; do not substitute moving `main` or
another checkpoint. Then use the reviewed SHA with the starter's base checks:

```sh
git fetch origin
git switch --detach d25831759530d4e4a1a022bb85d670e2f0964287
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

Confirm that `git rev-parse HEAD` prints `d25831759530d4e4a1a022bb85d670e2f0964287`
before creating the exercise branch.

### Historical baseline

The frozen starter README still records `d15eea431a214210160eb6e363945ef42b3fbcb8`
as its earlier code baseline and asks attendees to confirm the approved SHA in
#21. Preserve that historical evidence; use the reviewed `d258317...` revision
above for current attendee checkout instructions. Do not edit or advance the
frozen checkpoint to reconcile this guide.

## Compare the two states

From a reference checkout containing the comparison script, compare both MVP directories:

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
