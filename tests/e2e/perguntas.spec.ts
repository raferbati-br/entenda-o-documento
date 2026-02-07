import { test, expect } from "./fixtures/coverage";
import {
  mockCapture,
  mockAnalyzeSuccess,
  mockFeedbackSuccess,
  mockQaStreamError,
  mockQaStreamSuccess,
  mockSessionToken,
  goToResultFromHome,
} from "./helpers/flow";

async function mockClipboardAndShare(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    (window as any).__copiedText = "";
    (window as any).__sharedText = "";
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          (window as any).__copiedText = text;
        },
      },
      configurable: true,
    });
    Object.defineProperty(navigator, "share", {
      value: async (data: { text?: string }) => {
        (window as any).__sharedText = data?.text || "";
      },
      configurable: true,
    });
  });
}

async function goToPerguntas(page: import("@playwright/test").Page) {
  await mockSessionToken(page);
  await mockCapture(page);
  await mockAnalyzeSuccess(page);

  await goToResultFromHome(page);
  const perguntasButton = page.getByRole("button", { name: "Tirar duvidas" });
  await expect(perguntasButton).toBeVisible();
  await perguntasButton.click();
  await page.waitForURL("**/perguntas");
}

test("perguntas: acessar a tela @id(E2E-26)", async ({ page }) => {
  test.setTimeout(60000);
  await goToPerguntas(page);
  await expect(page.getByText(/tire suas duvidas/i)).toBeVisible();
});

test("perguntas: perguntas rapidas @id(E2E-27)", async ({ page }) => {
  await goToPerguntas(page);

  await expect(page.getByText("Qual e o prazo?")).toBeVisible();
  await page.getByText("Qual e o prazo?").click();
  await expect(page.getByLabel("Sua pergunta")).toHaveValue("Qual e o prazo?");
});

test("perguntas: enviar uma pergunta valida @id(E2E-28) @id(E2E-38)", async ({ page }) => {
  await mockQaStreamSuccess(page, "Resposta em tempo real.");
  await goToPerguntas(page);

  await page.getByLabel("Sua pergunta").fill("Qual e o prazo?");
  await page.getByRole("button", { name: /enviar pergunta/i }).click();

  await expect(page.getByText("Qual e o prazo?")).toBeVisible();
  await expect(page.getByText(/Resposta em tempo real/i)).toBeVisible();
});

test("perguntas: erro ao responder uma pergunta @id(E2E-29)", async ({ page }) => {
  await mockQaStreamError(page, "Erro ao responder.");
  await goToPerguntas(page);

  await page.getByLabel("Sua pergunta").fill("Qual e o prazo?");
  await page.getByRole("button", { name: /enviar pergunta/i }).click();

  await expect(page.getByText(/erro ao responder/i)).toBeVisible();
});

test("perguntas: feedback em uma resposta @id(E2E-30)", async ({ page }) => {
  await mockFeedbackSuccess(page);
  await mockQaStreamSuccess(page, "Resposta para feedback.");
  await goToPerguntas(page);

  await page.getByLabel("Sua pergunta").fill("Qual e o prazo?");
  await page.getByRole("button", { name: /enviar pergunta/i }).click();
  await expect(page.getByText(/Resposta para feedback/i)).toBeVisible();

  await page.getByRole("button", { name: /marcar como positivo/i }).first().click();
  await expect(page.getByText(/obrigado pelo feedback/i)).toBeVisible();

  await page.getByLabel("Sua pergunta").fill("Qual e o valor?");
  await page.getByRole("button", { name: /enviar pergunta/i }).click();
  await expect(page.getByText(/Resposta para feedback/i)).toBeVisible();

  await page.getByRole("button", { name: /marcar como negativo/i }).last().click();
  await page.getByRole("button", { name: "Incompleta" }).click();
  await expect(page.getByText(/obrigado pelo feedback/i)).toBeVisible();
});

test("perguntas: copiar ou compartilhar uma resposta @id(E2E-31)", async ({ page }) => {
  await mockClipboardAndShare(page);
  await mockQaStreamSuccess(page, "Resposta para copiar.");
  await goToPerguntas(page);

  await page.getByLabel("Sua pergunta").fill("Qual e o prazo?");
  await page.getByRole("button", { name: /enviar pergunta/i }).click();
  await expect(page.getByText(/Resposta para copiar/i)).toBeVisible();

  await page.getByRole("button", { name: /copiar resposta/i }).click();
  await page.waitForFunction(() => (window as any).__copiedText?.length > 0);

  await page.getByRole("button", { name: /compartilhar/i }).click();
  await page.waitForFunction(() => (window as any).__sharedText?.length > 0);
});

test("perguntas: ver documento durante o Q&A @id(E2E-33)", async ({ page }) => {
  await goToPerguntas(page);

  await page.getByRole("button", { name: /ver documento/i }).click();
  await expect(page.getByAltText(/documento|o que e este documento/i)).toBeVisible();
  await page.getByRole("button", { name: /voltar/i }).click();
});

test("perguntas: iniciar nova analise a partir do Q&A @id(E2E-34)", async ({ page }) => {
  await goToPerguntas(page);

  await page.getByRole("button", { name: /analisar outro/i }).click();
  await expect(page).toHaveURL(/\/camera/);
});
