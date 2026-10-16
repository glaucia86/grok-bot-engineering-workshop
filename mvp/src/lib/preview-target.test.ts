import { describe, expect, it } from "vitest";
import { previewTarget, permitsPreviewRequest } from "./preview-target";

const origin = "https://grok-bot-workshop-mvp-abc123xyz-glaucia86s-projects.vercel.app";
const env = { MVP_PREVIEW_URL: origin, MVP_PREVIEW_COMMIT: "a".repeat(40), MVP_PREVIEW_ISOLATED_AUTHORIZED: "true", MVP_PREVIEW_QA_DATABASE_ID: "qa-empty-branch" };

describe("remote preview safety gate (no network)", () => {
  it("accepts only an explicitly attested immutable deployment target", () => {
    expect(previewTarget(env)).toEqual({ origin, commit: "a".repeat(40), databaseId: "qa-empty-branch" });
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
