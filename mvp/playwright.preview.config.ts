import { defineConfig, devices } from "@playwright/test";

// Deliberately opt-in: this journey writes feedback. A URL alone is not consent
// to write into the currently shared preview/production database (issue #16).
const target = process.env.MVP_PREVIEW_URL;
const commit = process.env.MVP_PREVIEW_COMMIT;
if (!target || !commit || !/^[a-f0-9]{40}$/i.test(commit)
  || process.env.MVP_PREVIEW_ISOLATED_AUTHORIZED !== "true") {
  throw new Error("BLOCKED: provide MVP_PREVIEW_URL, exact MVP_PREVIEW_COMMIT, and MVP_PREVIEW_ISOLATED_AUTHORIZED=true only after isolated preview writes are authorized (issue #16).");
}
const url = new URL(target);
if (url.protocol !== "https:" || url.username || url.password) {
  throw new Error("Preview target must be HTTPS with no embedded credentials.");
}
export default defineConfig({
  testDir: "./e2e",
  testMatch: "preview-*.spec.ts",
  workers: 1,
  metadata: { target: url.origin, commit, evidenceScope: "authorized isolated PR preview" },
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: url.origin, trace: "on", screenshot: "on", ...devices["Desktop Chrome"] },
});
