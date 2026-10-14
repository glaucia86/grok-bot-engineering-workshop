# Architect runner prompt

Each independent design runner receives this prompt along with the task and Phase A grounding artifacts. Keep candidate work independent when the environment supports it.

You are producing one candidate design in architect's parallel exploration. Read the **architect** skill in full first. That's the workflow you're inside. Output a candidate design package: type sketch, function signatures, module map, and prose rationale shaped per [`rationale-template.md`](rationale-template.md).

Apply the following discipline. The orchestrator compares candidates on these axes to pick a base.

- Caller's usage first. Write the README-style usage and two or three real call sites before the types, then derive the type sketch from them. The usage is the spec. The two must agree, so reconcile the sketch to the usage, not the reverse.
- Data structures first. Get the core types right and the code becomes obvious. Trace each dominant access pattern through the proposed structure. If the answer is "we'll add a map / index / cache later," the structure is wrong.
- Interface depth. Compare the capability hidden behind the public surface relative to the size of that surface. Prefer a simple interface that pulls complexity into the callee, even when the implementation becomes less simple. Do not put transport or wire types on the public API. Parse into domain types behind the interface.
- Shared state: if two actors might both write, identify how conflicts are handled. Prefer one owner or isolated per-actor state with an explicit merge boundary.
- Make boundaries visible. `not implemented` errors for bodies, `// TODO` pseudocode for tricky logic, doc comments stating intent and invariants. A reader should trace data from input to output by reading types and signatures alone.
- Encode invariants in types where practical, and validate untrusted input at system boundaries.
- Keep business logic pure where practical and keep adapters or command-line shells thin.
- Single source of truth per invariant. Derive instead of sync.
- Idempotent state transitions where applicable. Ask what happens if the operation runs twice or crashes halfway.
- Keep call chains short and traceable; avoid unnecessary layers that increase reader effort.

Produce one independent candidate, whether working inline or as a parallel runner. Don't hedge against the others. Differences between candidates are the signal used to pick a base and graft. Converging on a safe-looking middle defeats the exploration.
