import { test, expect } from "./fixtures/coverage";
import { mockCapture, mockAnalyzeSuccess, mockSessionToken, goToConfirmFromHome, goToAnalyzingFromHome } from "./helpers/flow";

test("confirmacao: visualizar imagem capturada @id(E2E-9)", async ({ page }) => {
  await mockSessionToken(page);
  await goToConfirmFromHome(page);

  await expect(page.getByAltText("Captura")).toBeVisible();
});

test("confirmacao: enviar imagem para analise @id(E2E-11)", async ({ page }) => {
  await mockSessionToken(page);
  await mockCapture(page);
  await mockAnalyzeSuccess(page);
  await goToAnalyzingFromHome(page);

  await expect(page).toHaveURL(/\/analyzing/);
});
