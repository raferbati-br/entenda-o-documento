import { test, expect } from "./fixtures/coverage";
import { mockCapture, mockAnalyzeSuccess, mockSessionToken, goToResultFromHome } from "./helpers/flow";

test("perguntas: acessar a tela @id(E2E-26)", async ({ page }) => {
  test.setTimeout(60000);
  await mockSessionToken(page);
  await mockCapture(page);
  await mockAnalyzeSuccess(page);

  await goToResultFromHome(page);
  await page.getByRole("button", { name: "Tirar duvidas" }).click();
  await page.waitForURL("**/perguntas");

  await expect(page.getByRole("heading", { name: "Tire suas duvidas", exact: true })).toBeVisible();
  await expect(page.getByLabel("Sua pergunta")).toBeVisible();
});
