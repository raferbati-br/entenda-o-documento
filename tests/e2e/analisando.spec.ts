import { test, expect } from "./fixtures/coverage";
import { mockCapture, mockAnalyzeSuccess, mockSessionToken, goToResultFromHome } from "./helpers/flow";

test("analisando: processamento com sucesso @id(E2E-13)", async ({ page }) => {
  test.setTimeout(60000);
  await mockSessionToken(page);
  await mockCapture(page);
  await mockAnalyzeSuccess(page);

  await goToResultFromHome(page);

  await expect(page.getByRole("heading", { name: /Explica/i })).toBeVisible();
});
