import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { previewCiTarget } from "../../scripts/preview-ci";
import { withPreviewEvidence } from "./preview-evidence";

const origin = "https://grok-bot-workshop-mvp-abc123xyz-glaucia86s-projects.vercel.app";
const commit = "a".repeat(40);
const valid: Record<string, string> = {
  GITHUB_ACTIONS: "true", GITHUB_EVENT_NAME: "workflow_dispatch", GITHUB_REF: "refs/heads/main",
  MVP_PREVIEW_QA_ENABLED: "true",
  MVP_PREVIEW_URL: origin, MVP_PREVIEW_COMMIT: commit, MVP_PREVIEW_QA_DATABASE_ID: "qa-isolated-branch",
  MVP_PREVIEW_ISOLATED_AUTHORIZED: "true",
  MVP_PREVIEW_APPROVED_URL: origin, MVP_PREVIEW_APPROVED_COMMIT: commit,
  MVP_PREVIEW_APPROVED_QA_DATABASE_ID: "qa-isolated-branch",
};
const directories: string[] = [];
afterEach(async () => { for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true }); });

describe("manually dispatched preview CI gate, offline", () => {
  it("permits a matching approved configuration on main only", () => {
    expect(previewCiTarget(valid)).toEqual({ origin, commit, databaseId: "qa-isolated-branch" });
  });
  it.each(Object.keys(valid))("fails closed when %s is missing", (key) => {
    expect(() => previewCiTarget({ ...valid, [key]: undefined })).toThrow("BLOCKED");
  });
  it.each([
    ["GITHUB_EVENT_NAME", "pull_request"], ["GITHUB_REF", "refs/heads/unreviewed"],
    ["GITHUB_ACTIONS", "false"], ["MVP_PREVIEW_QA_ENABLED", "false"],
    ["MVP_PREVIEW_ISOLATED_AUTHORIZED", "false"],
    ["MVP_PREVIEW_APPROVED_URL", origin.replace("abc123xyz", "xyz987abc")],
    ["MVP_PREVIEW_APPROVED_COMMIT", "b".repeat(40)],
    ["MVP_PREVIEW_APPROVED_QA_DATABASE_ID", "another-qa-branch"],
    ["MVP_PREVIEW_URL", "https://grok-bot-workshop-mvp.vercel.app"],
    ["MVP_PREVIEW_APPROVED_QA_DATABASE_ID", "postgres://SECRET_SENTINEL"],
  ])("blocks unapproved %s without echoing its input", (key, value) => {
    expect(() => previewCiTarget({ ...valid, [key]: value })).toThrow(/^BLOCKED: preview CI configuration or authorization is missing or inconsistent\.$/);
  });
  it("uses the existing curated evidence lifecycle for an approved local fixture", async () => {
    const directory = await mkdtemp(join(tmpdir(), "preview-ci-fixture-"));
    directories.push(directory);
    const target = previewCiTarget(valid);
    await expect(withPreviewEvidence(directory, target, async run => {
      run.phase("form-submit"); run.postAttempt();
      throw new Error("SECRET_SENTINEL fixture only, no remote requests");
    })).rejects.toThrow("SECRET_SENTINEL");
    const [id] = await readdir(directory);
    const manifest = await readFile(join(directory, id, "manifest.json"), "utf8");
    const outcome = await readFile(join(directory, id, "outcome.json"), "utf8");
    expect(manifest + outcome).not.toContain("SECRET_SENTINEL");
    expect(JSON.parse(outcome)).toMatchObject({ status: "failed", attemptedPosts: 1, cleanup: "PENDING_AUTHORIZED_QA_LIFECYCLE" });
  });
  it("blocks the real CLI before browser launch and never echoes unsafe input", () => {
    const result = spawnSync(process.execPath, ["--import", "tsx", "scripts/preview-ci.ts", "--check"], {
      cwd: process.cwd(), windowsHide: true, encoding: "utf8", timeout: 15000,
      env: { ...process.env, ...valid, GITHUB_ACTIONS: "false", MVP_PREVIEW_URL: "https://user:SECRET_SENTINEL@example.com", DATABASE_URL: "" },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("BLOCKED: preview CI configuration or authorization");
    expect(result.stdout + result.stderr).not.toContain("SECRET_SENTINEL");
  });
  it("checks a valid event fixture through the CLI without trusting inherited target inputs", async () => {
    const directory = await mkdtemp(join(tmpdir(), "preview-ci-event-"));
    directories.push(directory);
    const eventPath = join(directory, "event.json");
    const inputs = { preview_url: origin, preview_commit: commit, qa_database_id: "qa-isolated-branch", isolated_authorized: "true" };
    await writeFile(eventPath, JSON.stringify({ inputs }));
    const result = spawnSync(process.execPath, ["--import", "tsx", "scripts/preview-ci.ts", "--check"], {
      cwd: process.cwd(), windowsHide: true, encoding: "utf8", timeout: 15000,
      env: { ...process.env, ...valid, GITHUB_EVENT_PATH: eventPath, MVP_PREVIEW_URL: "SECRET_SENTINEL", DATABASE_URL: "" },
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("No journey started.");
    expect(result.stdout + result.stderr).not.toContain("SECRET_SENTINEL");
    for (const event of ["malformed", "{}", JSON.stringify({ inputs: { ...inputs, preview_url: "https://user:SECRET_SENTINEL@example.com" } }), JSON.stringify({ inputs: { ...inputs, isolated_authorized: "false" } })]) {
      await writeFile(eventPath, event);
      const failure = spawnSync(process.execPath, ["--import", "tsx", "scripts/preview-ci.ts", "--check"], {
        cwd: process.cwd(), windowsHide: true, encoding: "utf8", timeout: 15000,
        env: { ...process.env, ...valid, GITHUB_EVENT_PATH: eventPath, DATABASE_URL: "" },
      });
      expect(failure.status).toBe(1);
      expect(failure.stderr).toContain("BLOCKED");
      expect(failure.stdout + failure.stderr).not.toContain("SECRET_SENTINEL");
    }
  });
  it("binds the CI workflow to manual execution, the offline gate and curated artifacts only", async () => {
    const workflow = await readFile(join(process.cwd(), "../.github/workflows/mvp-preview-qa.yml"), "utf8");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toMatch(/\b(pull_request|pull_request_target|push|schedule):/);
    expect(workflow).toContain("if: github.ref == 'refs/heads/main'");
    expect(workflow).toContain("environment: mvp-preview-qa");
    expect(workflow).toContain("cancel-in-progress: false");
    expect(workflow).not.toContain("secrets.");
    expect(workflow).not.toMatch(/\$\{\{[^}]*\binputs[.\[]/);
    const gate = workflow.indexOf("scripts/preview-ci.ts --check");
    expect(gate).toBeGreaterThan(0);
    expect(gate).toBeLessThan(workflow.indexOf("npx playwright install"));
    expect(workflow).toContain("run: node --import tsx scripts/preview-ci.ts\n");
    expect(workflow).toContain("if: always()");
    expect(workflow).toContain("mvp/preview-evidence/*/manifest.json");
    expect(workflow).toContain("mvp/preview-evidence/*/outcome.json");
    expect(workflow).not.toMatch(/playwright-report|test-results|DATABASE_URL/);
  });
});
