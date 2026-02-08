import { test, expect } from "./fixtures/coverage";
import { goToConfirmFromHome } from "./helpers/flow";

test("home: ver opcoes principais @id(E2E-3)", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Entenda qualquer documento num piscar de olhos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Galeria" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tirar foto" }).or(page.getByRole("link", { name: "Tirar foto" }))
  ).toBeVisible();
});

test("home: abrir galeria e seguir para confirmacao @id(E2E-5)", async ({ page }) => {
  await goToConfirmFromHome(page);

  await expect(page.getByAltText("Captura")).toBeVisible();
});

test("home: iniciar captura pela camera @id(E2E-4)", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("button", { name: "Tirar foto" })
    .or(page.getByRole("link", { name: "Tirar foto" }))
    .click();
  await expect(page).toHaveURL(/\/camera/);
});

test("home: ajustar fonte e contraste @id(E2E-39)", async ({ page }) => {
  await page.goto("/");

  const initialFontSize = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);

  await page.getByRole("button", { name: "Aumentar tamanho da fonte" }).click();
  const increasedFontSize = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);

  expect(Number.parseFloat(increasedFontSize)).toBeGreaterThan(Number.parseFloat(initialFontSize));

  await page.getByRole("button", { name: "Alternar alto contraste" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "high");
});
