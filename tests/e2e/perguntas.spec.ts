import { test, expect } from "./fixtures/coverage";
import { mockCapture, mockAnalyzeSuccess, mockSessionToken, goToResultFromHome } from "./helpers/flow";

test("perguntas: acessar a tela @id(E2E-26)", async ({ page }) => {
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
