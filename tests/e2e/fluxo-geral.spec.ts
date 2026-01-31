import { test, expect } from "./fixtures/coverage";
import {
  mockCapture,
  mockAnalyzeSuccess,
  mockAnalyzeError,
  mockSessionToken,
  goToResultFromHome,
  goToAnalyzingFromHome,
} from "./helpers/flow";

test("happy path: fluxo completo @id(E2E-1)", async ({ page }) => {
  test.setTimeout(60000);
  await mockSessionToken(page);
  await mockCapture(page);
  await mockAnalyzeSuccess(page);

  await goToResultFromHome(page);

  await expect(page.getByRole("heading", { name: /Explica/i })).toBeVisible();
  await expect(page.getByText("O que e este documento")).toBeVisible();
});

test("error path: falha na analise e recuperacao @id(E2E-2) @id(E2E-14)", async ({ page }) => {
  await mockSessionToken(page);
  await mockCapture(page, "cap_test_2");
  await mockAnalyzeError(page);

  await goToAnalyzingFromHome(page);
  await expect(page.getByText(/entendi a foto/i)).toBeVisible();
});
