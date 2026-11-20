import { describe, expect, it } from "vitest";
import {
  blockedPreviewMessage,
  bypassHeaders,
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
