import { test, expect } from "./fixtures/coverage";
import {
  mockCapture,
  mockAnalyzeSuccess,
  mockAnalyzeError,
  mockSessionToken,
  goToResultFromHome,
  goToAnalyzingFromHome,
} from "./helpers/flow";

test("analisando: processamento com sucesso @id(E2E-13)", async ({ page }) => {
  test.setTimeout(60000);
  await mockSessionToken(page);
  await mockCapture(page);
  await mockAnalyzeSuccess(page);

  await goToResultFromHome(page);

  await expect(page.getByRole("heading", { name: /Explica/i })).toBeVisible();
});

test("analisando: erro na analise com mensagem amigavel @id(E2E-14)", async ({ page }) => {
  await mockSessionToken(page);
  await mockCapture(page, "cap_test_2");
  await mockAnalyzeError(page);

  await goToAnalyzingFromHome(page);

  await expect(page.getByRole("heading", { name: /nao entendi a foto/i })).toBeVisible();
  await expect(page.getByText(/modelo nao retornou json valido/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /tentar outra foto/i })).toBeVisible();
});

test("analisando: cancelar a analise em andamento @id(E2E-15)", async ({ page }) => {
  test.setTimeout(60000);
  await mockSessionToken(page);

  await page.addInitScript(() => {
    sessionStorage.setItem("eod_capture_id_v1", "cap_cancel_1");
  });

  await page.route("**/api/ocr", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, documentText: "" }),
    });
  });

  await page.goto("/analyzing");

  await page.getByRole("button", { name: /cancelar/i }).click();
  await expect(page).toHaveURL(/\/camera/);
});

test("analisando: captura ausente redireciona para home @id(E2E-16)", async ({ page }) => {
  await page.goto("/analyzing");
  await expect(page).toHaveURL(/\/$/);
});
