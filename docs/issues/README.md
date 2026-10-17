# Workshop exercises and implementation issues

## Main track: Next.js MVP

The [technical specification](../../spec.md) and [inception](../inception.md) define scope. The GitHub issues below track execution; this index is not a second specification or slices plan.

The live target is the [90-minute core exercise](../../spec.md#90-minute-teaching-boundary): create FDE/QA/DevOps, implement feedback submission and simple grouped results, test independently and review with the human. The [budget and cut line](../inception.md#90-minute-budget-and-cut-line) reserve recovery time. Main's approved rating distribution/comments and polished layout are a prebuilt showcase or optional extension; `/api/feedback/insights` is not required in the frozen starter. Compare shared behavior explicitly rather than treating all reference features as attendee deliverables.

1. [#16 — PREP: prove isolated MVP preview verification](https://github.com/glaucia86/grok-bot-engineering-workshop/issues/16). Infrastructure/API proof before the event; no form/dashboard implementation.
2. [#17 — PREP: align the workshop route and legacy exercises](https://github.com/glaucia86/grok-bot-engineering-workshop/issues/17). Text drafting can run in parallel with #16; final preview instructions/sign-off depend on its evidence and verification against merged [PR #9](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/9). Visual deck/presenter walkthrough remains part of this issue.
3. [#18 — reference application: public feedback form](https://github.com/glaucia86/grok-bot-engineering-workshop/issues/18). Depends on #16 and the criteria in #9. Implement the complete reference before the event through reviewed PRs and human merges; participants reproduce the exercise from the separate checkpoint.
4. [#19 — reference application: persisted talk dashboard](https://github.com/glaucia86/grok-bot-engineering-workshop/issues/19). The dashboard implementation is merged in #26. Reuse its existing grouping from merged [PR #10](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/10); acceptance still depends on the #16 evidence.

5. [#20 — reveal.js presentation site](https://github.com/glaucia86/grok-bot-engineering-workshop/issues/20). Reuse the existing deck and supplied Grok Bot images; coordinate guide/slide mapping with #17. Visual verification is separate from this text alignment.
6. [#21 — exercise checkpoint and reference comparison](https://github.com/glaucia86/grok-bot-engineering-workshop/issues/21). Reuse checkpoint/mvp-base; document/freeze its base now, then verify it against the completed reference from #18/#19 and the #16 preview route.

The form/dashboard reference implementation is merged in [PR #26](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/26), with optional comments and accessible stars in [PR #27](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/27). Criteria #9 and grouping #10 are merged. This records implementation state, not issue closure or remote acceptance: #16 still requires isolated preview evidence and #21 requires the verified comparison and instructor-approved frozen SHA. The [current verified starter handoff in #21](https://github.com/glaucia86/grok-bot-engineering-workshop/issues/21#issuecomment-6206554790) records `d25831759530d4e4a1a022bb85d670e2f0964287`. Confirm that full SHA in the authorized exercise repository; do not replace it with moving main. The reference design from [PR #46](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/46) is integrated at `341de005662906e3c3ce46d45e12461e45c24a55`; its insights are the optional enhancement, not a new frozen starter. Preserve its UI exercise gaps. Only Glaucia approves and merges; documentation does not move the checkpoint ref.

### Reconcile execution issues after this scope alignment is merged

- [#17](https://github.com/glaucia86/grok-bot-engineering-workshop/issues/17) and [#20](https://github.com/glaucia86/grok-bot-engineering-workshop/issues/20): the English/Portuguese READMEs, guide, and deck were aligned in this change to reserve 70–82 (12:10–12:22 Brasília) for core recovery first, which never extends past 12:22 BRT. The recap/Q&A block starts at 12:22 BRT (10:22 ET), blockers are stated aloud on entry, and questions open at 12:26 BRT. The routine is skipped while core implementation, tests, or human review are unfinished and appears only as a disabled draft if the core is complete and time remains. Human review remains pending; this is not a timed-rehearsal result or human visual validation.
- #19: distinguish the core average-per-talk exercise from the approved reference distribution. Preserve both targets' actual API/test contracts and the requirement for isolated preview evidence.
- #21: retain starter gaps and the exact approved SHA; complete the core rehearsal/comparison and presenter sign-off. A source comparison or green base checks alone do not close the issue.
- #16: isolated preview, fresh-instance persistence and authorized test-data lifecycle are still required. Optional scope does not relax these gates or authorize shared-data writes.

## Extra practice: legacy Fastify

These existing Markdown exercises are intentionally retained, not recreated as MVP tickets. Run their commands from the repository root. Their optional-rating/in-memory API differs from the strict, persistent MVP in `mvp/`.

- [01 — add talk rating](01-add-talk-rating.md): deliberately vague clarification/offline-triage exercise. Rating is already implemented on current main; an earlier exercise checkpoint supports practicing the implementation.
- [02 — delete feedback](02-delete-feedback.md): optional Fastify DELETE exercise; not an MVP requirement or permission to delete remote data.
- [03 — feedback summary](03-feedback-summary.md): optional Fastify count/latest endpoint; not the MVP average/count dashboard contract.

Historical numbered checkpoints belong to this extra track. They are not replacement MVP starting points and should not be merged wholesale into main. [MVP commands and evidence limits](../../mvp/README.md) remain the source for running the main application.
