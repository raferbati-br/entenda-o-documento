import { test, expect } from "./fixtures/coverage";

const TOKEN = "test-token";

test("metrics: acessar o dashboard com token valido @id(E2E-35)", async ({ page }) => {
  await page.goto(`/metrics?token=${TOKEN}`);

  await expect(page.getByRole("heading", { name: /quality metrics/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Analyze" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "OCR" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Q&A" })).toBeVisible();
});

test("metrics: bloquear acesso sem token valido @id(E2E-36)", async ({ page }) => {
  await page.goto("/metrics");

  await expect(page.getByText(/missing or invalid token/i)).toBeVisible();
});
