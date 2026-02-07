import { test, expect } from "./fixtures/coverage";
import { uploadTinyImageTo } from "./helpers/flow";

test("camera: ver dicas de captura @id(E2E-6)", async ({ page }) => {
  await page.goto("/camera");

  await expect(page.getByText(/letras/i)).toBeVisible();
  await expect(page.getByText(/boa/i)).toBeVisible();
  await expect(page.getByText(/enquadramento/i)).toBeVisible();
  await expect(page.getByText(/dica/i)).toBeVisible();
});

test("camera: tirar foto pela camera @id(E2E-7)", async ({ page }) => {
  await page.goto("/camera");

  await uploadTinyImageTo(page, 'input[type="file"][capture="environment"]');
  await expect(page).toHaveURL(/\/confirm/);
});

test("camera: escolher imagem pela galeria @id(E2E-8)", async ({ page }) => {
  await page.goto("/camera");

  await uploadTinyImageTo(page, 'input[type="file"]:not([capture])');
  await expect(page).toHaveURL(/\/confirm/);
});
