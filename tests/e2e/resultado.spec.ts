import { test, expect } from "./fixtures/coverage";
import {
  mockCapture,
  mockAnalyzeSuccess,
  mockAnalyzeLowConfidence,
  mockFeedbackSuccess,
  mockSessionToken,
  goToResultFromHome,
} from "./helpers/flow";

declare global {
  interface Window {
    __copiedText?: string;
    __sharedText?: string;
  }
}

async function mockClipboardAndShare(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    window.__copiedText = "";
    window.__sharedText = "";
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          window.__copiedText = text;
        },
      },
      configurable: true,
    });
    Object.defineProperty(navigator, "share", {
      value: async (data: { text?: string }) => {
        window.__sharedText = data?.text || "";
      },
      configurable: true,
    });
  });
}

test("resultado: exibir cards principais @id(E2E-17)", async ({ page }) => {
  test.setTimeout(60000);
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

test("resultado: aviso de baixa confianca @id(E2E-18) @id(E2E-37)", async ({ page }) => {
  await mockSessionToken(page);
  await mockCapture(page);
  await mockAnalyzeLowConfidence(page);

  await goToResultFromHome(page);

  await expect(page.getByText(/foto .*ler/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /refazer/i })).toBeVisible();
});

test("resultado: compartilhar ou copiar resultado @id(E2E-21)", async ({ page }) => {
  await mockClipboardAndShare(page);
  await mockSessionToken(page);
  await mockCapture(page);
  await mockAnalyzeSuccess(page);

  await goToResultFromHome(page);

  await page.getByRole("button", { name: /compartilhar/i }).click();
  await page.waitForFunction(() => window.__sharedText?.length > 0);

  await page.getByRole("button", { name: /copiar resposta/i }).click();
  await page.waitForFunction(() => window.__copiedText?.length > 0);
});

test("resultado: enviar feedback positivo @id(E2E-22)", async ({ page }) => {
  await mockSessionToken(page);
  await mockFeedbackSuccess(page);
  await mockCapture(page);
  await mockAnalyzeSuccess(page);

  await goToResultFromHome(page);

  await page.getByRole("button", { name: /marcar como positivo/i }).click();
  await expect(page.getByText(/obrigado pelo feedback/i)).toBeVisible();
});

test("resultado: enviar feedback negativo com motivo @id(E2E-23)", async ({ page }) => {
  await mockSessionToken(page);
  await mockFeedbackSuccess(page);
  await mockCapture(page);
  await mockAnalyzeSuccess(page);

  await goToResultFromHome(page);

  await page.getByRole("button", { name: /marcar como negativo/i }).click();
  await page.getByRole("button", { name: "Incompleta" }).click();
  await expect(page.getByText(/obrigado pelo feedback/i)).toBeVisible();
});

test("resultado: iniciar uma nova analise @id(E2E-24)", async ({ page }) => {
  await mockSessionToken(page);
  await mockCapture(page);
  await mockAnalyzeSuccess(page);

  await goToResultFromHome(page);

  await page.getByRole("button", { name: /analisar outro/i }).click();
  await expect(page).toHaveURL(/\/camera/);
});
