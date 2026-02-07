import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: process.env.CI === "true" ? 60_000 : 30_000,
  expect: { timeout: process.env.CI === "true" ? 10_000 : 5_000 },
  workers: process.env.CI === "true" ? 1 : undefined,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: process.env.CI === "true" ? "npm run start" : "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: process.env.CI !== "true",
    timeout: 180_000,
    env: {
      API_TOKEN_SECRET: "test-secret",
      APP_ORIGIN: "http://localhost:3000",
      DISABLE_CSP: "1",
      E2E_TEST: "1",
      METRICS_DASHBOARD_TOKEN: "test-token",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
