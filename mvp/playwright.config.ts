import { defineConfig, devices } from "@playwright/test";
import { bypassHeaders, requirePlaywrightBaseUrl } from "./src/lib/preview-e2e";

const baseURL = requirePlaywrightBaseUrl(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  outputDir: "test-results",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    extraHTTPHeaders: bypassHeaders(process.env.VERCEL_AUTOMATION_BYPASS_SECRET),
    trace: "retain-on-failure",
    video: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
