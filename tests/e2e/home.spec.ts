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
