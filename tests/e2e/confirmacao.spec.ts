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

test("confirmacao: trocar a imagem por outra @id(E2E-10)", async ({ page }) => {
  await mockSessionToken(page);
  await goToConfirmFromHome(page);

  await page.getByRole("button", { name: /escolher outra/i }).click();
  await expect(page).toHaveURL(/\/camera/);
});

test("confirmacao: exibir erro ao enviar a imagem @id(E2E-12)", async ({ page }) => {
  await mockSessionToken(page);
  await goToConfirmFromHome(page);

  await page.route("**/api/capture", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "Erro interno." }),
    });
  });

  await page.getByRole("button", { name: /usar esta/i }).click();

  const errorNotice = page.getByText(/erro interno|tente novamente/i);
  await expect(errorNotice).toBeVisible();

  await page.getByRole("button", { name: /fechar aviso/i }).click();
  await expect(errorNotice).toBeHidden();
});
