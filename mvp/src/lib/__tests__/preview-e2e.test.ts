import { describe, expect, it } from "vitest";
import {
  blockedPreviewMessage,
  bypassHeaders,
  isolatedDatabaseDecision,
  looksLikeVercelLogin,
  requirePlaywrightBaseUrl,
  selectPreviewOrigin,
} from "../preview-e2e";

describe("requirePlaywrightBaseUrl", () => {
  it("requires an explicit origin and never invents production", () => {
    expect(() => requirePlaywrightBaseUrl(undefined)).toThrow(/PLAYWRIGHT_BASE_URL is required/);
    expect(() => requirePlaywrightBaseUrl("   ")).toThrow(/PLAYWRIGHT_BASE_URL is required/);
    expect(() => requirePlaywrightBaseUrl("https://user:secret@example.com")).toThrow(/credentials/);
  });

  it("returns the origin without a path", () => {
    expect(requirePlaywrightBaseUrl("https://preview.example.com/feedback")).toBe("https://preview.example.com");
    expect(requirePlaywrightBaseUrl("http://127.0.0.1:3456")).toBe("http://127.0.0.1:3456");
  });
});

describe("selectPreviewOrigin", () => {
  it("uses a successful Preview deployment and ignores production", () => {
    expect(selectPreviewOrigin([
      { state: "success", environment: "Production", environment_url: "https://prod.example.com" },
      { state: "failure", environment: "Preview", environment_url: "https://bad.example.com" },
      { state: "success", environment: "Preview", environment_url: "https://preview.example.com/path" },
    ])).toBe("https://preview.example.com");
  });

  it("returns null when no successful preview URL exists", () => {
    expect(selectPreviewOrigin([])).toBeNull();
    expect(selectPreviewOrigin([{ state: "success", environment: "Preview" }])).toBeNull();
  });
});

describe("isolatedDatabaseDecision", () => {
  const approved = {
    MVP_PREVIEW_QA_ENABLED: "true",
    MVP_PREVIEW_APPROVED_URL: "https://preview.example.com",
    MVP_PREVIEW_APPROVED_COMMIT: "abc123",
    MVP_PREVIEW_APPROVED_QA_DATABASE_ID: "qa-db",
    MVP_PREVIEW_ISOLATED_AUTHORIZED: "true",
    PLAYWRIGHT_BASE_URL: "https://preview.example.com/",
    MVP_PREVIEW_COMMIT: "abc123",
  };

  it("stays disabled and names every missing variable", () => {
    const decision = isolatedDatabaseDecision({});
    expect(decision.enabled).toBe(false);
    expect(decision.missing).toEqual([
      "MVP_PREVIEW_QA_ENABLED",
      "MVP_PREVIEW_APPROVED_URL",
      "MVP_PREVIEW_APPROVED_COMMIT",
      "MVP_PREVIEW_APPROVED_QA_DATABASE_ID",
      "MVP_PREVIEW_ISOLATED_AUTHORIZED",
    ]);
    expect(decision.reason).toMatch(/^BLOCKED:/);
  });

  it("enables the flag only when the approved isolated preview matches", () => {
    expect(isolatedDatabaseDecision(approved).enabled).toBe(true);
    expect(isolatedDatabaseDecision({ ...approved, PLAYWRIGHT_BASE_URL: "https://other.example.com" }).enabled).toBe(false);
    expect(isolatedDatabaseDecision({ ...approved, MVP_PREVIEW_ISOLATED_AUTHORIZED: "false" }).enabled).toBe(false);
  });
});

describe("preview protection", () => {
  it("sends the bypass headers only when a secret is present", () => {
    expect(bypassHeaders(undefined)).toEqual({});
    expect(bypassHeaders("")).toEqual({});
    expect(bypassHeaders("test-bypass")).toEqual({
      "x-vercel-protection-bypass": "test-bypass",
      "x-vercel-set-bypass-cookie": "true",
    });
  });

  it("recognizes a Vercel login redirect", () => {
    expect(looksLikeVercelLogin("https://vercel.com/login?next=%2F", "", "")).toBe(true);
    expect(looksLikeVercelLogin("https://vercel.com/sso-api?url=https%3A%2F%2Fpreview.example", "", "")).toBe(true);
    expect(looksLikeVercelLogin("https://preview.example.com/", "Talk feedback", "Rate a talk")).toBe(false);
    expect(blockedPreviewMessage(false)).toMatch(/^BLOCKED:.*VERCEL_AUTOMATION_BYPASS_SECRET is unset/);
    expect(blockedPreviewMessage(true)).toMatch(/^BLOCKED:.*is set/);
  });
});
