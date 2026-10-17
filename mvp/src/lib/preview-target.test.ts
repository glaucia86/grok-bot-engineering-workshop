import { describe, expect, it } from "vitest";
import { previewTarget, permitsPreviewRequest } from "./preview-target";

const origin = "https://grok-bot-workshop-mvp-abc123xyz-glaucia86s-projects.vercel.app";
const env = { MVP_PREVIEW_URL: origin, MVP_PREVIEW_COMMIT: "a".repeat(40), MVP_PREVIEW_ISOLATED_AUTHORIZED: "true", MVP_PREVIEW_QA_DATABASE_ID: "qa-empty-branch" };
const reviewedOrigin = "https://grok-bot-workshop-bpxtrs2fd-glaucia86s-projects.vercel.app";
const reviewedCommit = "70c732f6ea070cc413e1cb1fc91fb352d705e835";

describe("remote preview safety gate (no network)", () => {
  it("accepts only an explicitly attested immutable deployment target", () => {
    expect(previewTarget(env)).toEqual({ origin, commit: "a".repeat(40), databaseId: "qa-empty-branch" });
  });
  it.each([reviewedOrigin, `${reviewedOrigin}/`])("accepts the reviewed shortened deployment only with its pinned SHA: %s", target => {
    expect(previewTarget({ ...env, MVP_PREVIEW_URL: target, MVP_PREVIEW_COMMIT: reviewedCommit }))
      .toEqual({ origin: reviewedOrigin, commit: reviewedCommit, databaseId: "qa-empty-branch" });
  });
  it("compares the reviewed SHA case-insensitively without changing its returned value", () => {
    expect(previewTarget({ ...env, MVP_PREVIEW_URL: reviewedOrigin, MVP_PREVIEW_COMMIT: reviewedCommit.toUpperCase() }).commit)
      .toBe(reviewedCommit.toUpperCase());
  });
  it("does not let an attestation replace the reviewed deployment SHA", () => {
    expect(() => previewTarget({ ...env, MVP_PREVIEW_URL: reviewedOrigin })).toThrow(/^BLOCKED: unsafe preview target\.$/);
  });
  it.each([
    "https://grok-bot-workshop-abc123xyz-glaucia86s-projects.vercel.app",
    "https://grok-bot-workshop-4a4g679p8-glaucia86s-projects.vercel.app",
    "https://grok-bot-workshop-bufnruefb-glaucia86s-projects.vercel.app",
    "https://grok-bot-workshop.vercel.app",
    "https://grok-bot-workshop-glaucia86s-projects.vercel.app",
    "https://grok-bot-workshop-mvp-glaucia86s-projects.vercel.app",
    "https://grok-bot-workshop-mvp-git-ui-loop-bl-0cfc5d-glaucia86s-projects.vercel.app",
    reviewedOrigin.replace("glaucia86s-projects", "another-team"),
    reviewedOrigin.replace("bpxtrs2fd", "bpxtrs2f"),
    reviewedOrigin.replace("bpxtrs2fd", "bpxtrs2fd0"),
    `${reviewedOrigin}.evil.example`, `${reviewedOrigin}/path`, `${reviewedOrigin}?`, `${reviewedOrigin}#`,
    reviewedOrigin.replace("https://", "https://user:DO_NOT_ECHO@"), `${reviewedOrigin}:8443`,
  ])("rejects unreviewed shortened hosts, production hosts and ambiguous targets: %s", target => {
    expect(() => previewTarget({ ...env, MVP_PREVIEW_URL: target, MVP_PREVIEW_COMMIT: reviewedCommit }))
      .toThrow(/^BLOCKED: unsafe preview target\.$/);
  });
  it.each([origin, reviewedOrigin])("rejects non-canonical URL spellings for %s", target => {
    for (const malformed of [
      ` ${target}`, `${target}\n`, target.replace("https://", "https:////"),
      target.replace("grok", "%67rok"), target.replace("grok", "gr\tok"),
      `${target}:443`, `${target}/./`, `${target}/%2e`, `${target}\\`,
      target.replace("https://", "https://@"),
    ]) {
      expect(() => previewTarget({ ...env, MVP_PREVIEW_URL: malformed, MVP_PREVIEW_COMMIT: reviewedCommit }))
        .toThrow(/^BLOCKED: unsafe preview target\.$/);
    }
  });
  it.each(Object.keys(env))("blocks missing %s", (key) => {
    expect(() => previewTarget({ ...env, [key]: undefined })).toThrow("BLOCKED");
  });
  it.each([
    "http://localhost:3000", "https://localhost", "https://127.0.0.1", "https://10.0.0.1",
    "https://grok-bot-workshop-mvp.vercel.app", "https://example.com",
    "https://grok-bot-workshop-mvp-git-main-glaucia86s-projects.vercel.app",
    `${origin}/path`, `${origin}?token=DO_NOT_ECHO`, `${origin}#DO_NOT_ECHO`,
    origin.replace("https://", "https://user:DO_NOT_ECHO@"), "not a URL DO_NOT_ECHO",
    `${origin}:8443`,
  ])("rejects an unsafe or ambiguous target without echoing input", (target) => {
    expect(() => previewTarget({ ...env, MVP_PREVIEW_URL: target })).toThrow(/^BLOCKED: unsafe preview target\.$/);
  });
  it("rejects an invalid SHA and unsafe database identity", () => {
    expect(() => previewTarget({ ...env, MVP_PREVIEW_COMMIT: "main" })).toThrow("BLOCKED");
    expect(() => previewTarget({ ...env, MVP_PREVIEW_QA_DATABASE_ID: "postgres://DO_NOT_ECHO" })).toThrow("BLOCKED");
  });
  it("allows same-origin assets but blocks redirects and third-party requests", () => {
    expect(permitsPreviewRequest(`${origin}/api/feedback`, origin)).toBe(true);
    expect(permitsPreviewRequest("https://grok-bot-workshop-mvp.vercel.app/api/feedback", origin)).toBe(false);
    expect(permitsPreviewRequest(`${origin}.evil.example/api/feedback`, origin)).toBe(false);
    expect(permitsPreviewRequest("data:text/plain,test", origin)).toBe(false);
    expect(permitsPreviewRequest("invalid", origin)).toBe(false);
  });
});
