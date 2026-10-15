import { defineConfig, devices } from "@playwright/test";

// Local UX checks intercept the API in the browser. No Neon connection or writes.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "local-*.spec.ts",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3187",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node scripts/local-browser-server.mjs",
    url: "http://127.0.0.1:3187",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
