import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, expect, it, vi } from "vitest";
import { withPreviewEvidence } from "./preview-evidence";

vi.mock("node:fs/promises", async (original) => {
  const actual = await original<typeof import("node:fs/promises")>();
  return { ...actual, writeFile: vi.fn(actual.writeFile) };
});

const target = { origin: "https://grok-bot-workshop-mvp-abc123xyz-glaucia86s-projects.vercel.app", commit: "a".repeat(40), databaseId: "qa-branch" };
const directories: string[] = [];
async function root() {
  const directory = await mkdtemp(join(tmpdir(), "preview-evidence-"));
  directories.push(directory);
  return directory;
}
afterEach(async () => { for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true }); });

it("awaits a durable manifest before journey writes and retains separate successful runs", async () => {
  const directory = await root();
  for (let index = 0; index < 2; index++) {
    await withPreviewEvidence(directory, target, async (run) => {
      const manifest = JSON.parse(await readFile(join(directory, run.runId, "manifest.json"), "utf8"));
      expect(manifest).toMatchObject({ runId: run.runId, talk: run.talk, ...target, maximumPostRequests: 4 });
      run.phase("form-submit");
      run.postAttempt();
      run.phase("verified");
      return { count: 1, average: 5 };
    });
  }
  const runs = await readdir(directory);
  expect(runs).toHaveLength(2);
  for (const id of runs) {
    const result = JSON.parse(await readFile(join(directory, id, "outcome.json"), "utf8"));
    expect(result).toMatchObject({ status: "passed", phase: "verified", attemptedPosts: 1, observedCount: 1, observedAverage: 5 });
    expect(await readdir(join(directory, id))).toEqual(["manifest.json", "outcome.json"]);
  }
});

it("keeps cleanup identifiers and sanitized failure evidence after a write attempt", async () => {
  const directory = await root();
  await expect(withPreviewEvidence(directory, { ...target, token: "SECRET_SENTINEL" }, async (run) => {
    run.phase("form-submit"); run.postAttempt();
    throw new Error("SECRET_SENTINEL provider response/headers");
  })).rejects.toThrow("SECRET_SENTINEL");
  const [id] = await readdir(directory);
  const manifest = await readFile(join(directory, id, "manifest.json"), "utf8");
  const result = await readFile(join(directory, id, "outcome.json"), "utf8");
  expect(manifest + result).not.toContain("SECRET_SENTINEL");
  expect(JSON.parse(result)).toMatchObject({ status: "failed", phase: "form-submit", attemptedPosts: 1,
    cleanup: "PENDING_AUTHORIZED_QA_LIFECYCLE", freshInstance: "NOT_VERIFIED" });
  expect(JSON.parse(result)).not.toHaveProperty("observedCount");
});

it("does not start the journey when manifest storage fails", async () => {
  const directory = await root();
  const blocked = join(directory, "not-a-directory");
  await writeFile(blocked, "local fixture");
  let posts = 0;
  await expect(withPreviewEvidence(blocked, target, async () => { posts++; return { count: 1, average: 5 }; })).rejects.toThrow();
  expect(posts).toBe(0);
});

it("aborts before POST if the manifest file write itself fails", async () => {
  const directory = await root();
  vi.mocked(writeFile).mockRejectedValueOnce(new Error("controlled disk write failure"));
  let posts = 0;
  await expect(withPreviewEvidence(directory, target, async () => { posts++; return { count: 1, average: 5 }; })).rejects.toThrow("controlled disk write failure");
  expect(posts).toBe(0);
  const [id] = await readdir(directory);
  expect(await readdir(join(directory, id))).toEqual([]);
});

it("bounds attempted POSTs and does not record unverified statistics", async () => {
  const directory = await root();
  let posts = 0;
  await expect(withPreviewEvidence(directory, target, async (run) => {
    for (let index = 0; index < 5; index++) { run.postAttempt(); posts++; }
    return { count: 1, average: 5 };
  })).rejects.toThrow("POST limit");
  expect(posts).toBe(4);
  const [id] = await readdir(directory);
  const result = JSON.parse(await readFile(join(directory, id, "outcome.json"), "utf8"));
  expect(result).toMatchObject({ status: "failed", attemptedPosts: 4 });
  expect(result).not.toHaveProperty("observedAverage");
});

it("keeps the manifest and fails if terminal evidence cannot be saved after a POST", async () => {
  const directory = await root();
  await expect(withPreviewEvidence(directory, target, async (run) => {
    run.postAttempt(); run.phase("verified");
    vi.mocked(writeFile).mockRejectedValueOnce(new Error("controlled terminal write failure"));
    return { count: 1, average: 5 };
  })).rejects.toThrow("controlled terminal write failure");
  const [id] = await readdir(directory);
  expect(await readdir(join(directory, id))).toEqual(["manifest.json"]);
  expect(JSON.parse(await readFile(join(directory, id, "manifest.json"), "utf8"))).toMatchObject({ runId: id, talk: `QA-${id}` });
});
