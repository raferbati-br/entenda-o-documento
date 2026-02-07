import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  workers: 10,
  testDir: "tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: false,
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
