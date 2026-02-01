import { test, expect } from "./fixtures/coverage";
import { mockCapture, mockAnalyzeSuccess, mockSessionToken, goToResultFromHome } from "./helpers/flow";

test("resultado: exibir cards principais @id(E2E-17)", async ({ page }) => {
  await mockSessionToken(page);
  await mockCapture(page);
  await mockAnalyzeSuccess(page);

  await goToResultFromHome(page);

  await expect(page.getByRole("heading", { name: /Explica/i })).toBeVisible();
  await expect(page.getByText("O que e este documento")).toBeVisible();
});

test("resultado: abrir fluxo de perguntas @id(E2E-25)", async ({ page }) => {
  test.setTimeout(60000);
  await mockSessionToken(page);
  await mockCapture(page);
  await mockAnalyzeSuccess(page);

  await goToResultFromHome(page);

  const perguntasButton = page.getByRole("button", { name: "Tirar duvidas" });
  await expect(perguntasButton).toBeVisible();
  await perguntasButton.click();
  await page.waitForTimeout(500);
});
