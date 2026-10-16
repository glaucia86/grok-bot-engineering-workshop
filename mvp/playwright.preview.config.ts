import { defineConfig, devices } from "@playwright/test";
import { previewTarget } from "./src/lib/preview-target";

// Deliberately opt-in: this journey writes feedback. A URL alone is not consent
// to write into the currently shared preview/production database (issue #16).
const target = previewTarget(process.env);
export default defineConfig({
  testDir: "./e2e",
  testMatch: "preview-*.spec.ts",
  workers: 1,
  retries: 0,
  metadata: { ...target, evidenceScope: "operator-attested isolated preview; deployment SHA/isolation require external verification" },
  reporter: [["list"]],
  // Curated JSON lives outside outputDir; discard automatic failure context.
  preserveOutput: "never",
  use: {
    ...devices["Desktop Chrome"], baseURL: target.origin,
    trace: "off", screenshot: "off", video: "off", serviceWorkers: "block",
  },
});
