import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { previewTarget } from "./preview-target";

type Target = ReturnType<typeof previewTarget>;
type Phase = "preflight" | "invalid-submit" | "form-submit" | "reload" | "verified";
type Summary = { count: number; average: number };
const phases: Phase[] = ["preflight", "invalid-submit", "form-submit", "reload", "verified"];
type Run = { runId: string; talk: string; phase(value: Phase): void; postAttempt(): void };

// Separate from Playwright's outputDir: later runs must not erase cleanup IDs.
// Only allowlisted synthetic fields are serialized; never errors/responses/env.
export async function withPreviewEvidence<T extends Target>(root: string, target: T, journey: (run: Run) => Promise<Summary>) {
  const runId = randomUUID();
  const talk = `QA-${runId}`;
  const directory = join(root, runId);
  const identity = { runId, talk, origin: target.origin, commit: target.commit, databaseId: target.databaseId };
  const lifecycle = { cleanup: "PENDING_AUTHORIZED_QA_LIFECYCLE", freshInstance: "NOT_VERIFIED" };
  const save = (name: string, payload: object) => writeFile(join(directory, name), `${JSON.stringify(payload, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  await mkdir(root, { recursive: true, mode: 0o700 });
  await mkdir(directory, { mode: 0o700 });
  // Failure here prevents the callback (and every remote request) from starting.
  await save("manifest.json", { schemaVersion: 1, ...identity, ...lifecycle,
    maximumPostRequests: 4, expectedCreatedRows: 1, plannedValidRequests: 1, plannedInvalidRequests: 3 });
  let phase: Phase = "preflight";
  let attemptedPosts = 0;
  const run: Run = {
    runId, talk,
    phase(value) {
      if (!phases.includes(value)) throw new Error("Invalid evidence phase");
      phase = value;
    },
    postAttempt() {
      if (attemptedPosts >= 4) throw new Error("Preview POST limit exceeded");
      attemptedPosts++;
    },
  };
  let summary: Summary;
  try {
    summary = await journey(run);
    if (!Number.isInteger(summary.count) || summary.count < 0 || !Number.isFinite(summary.average)
      || summary.average < 0 || summary.average > 5) throw new Error("Invalid verified summary");
  } catch (error) {
    await save("outcome.json", { schemaVersion: 1, ...identity, ...lifecycle,
      status: "failed", phase, attemptedPosts });
    throw error;
  }
  await save("outcome.json", { schemaVersion: 1, ...identity, ...lifecycle,
    status: "passed", phase, attemptedPosts, observedCount: summary.count, observedAverage: summary.average });
}
