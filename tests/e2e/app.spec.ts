import { test, expect } from "@playwright/test";

const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

test("happy path: analyze document and show result", async ({ page }) => {
  // Mock capture to avoid backend dependency.
  await page.route("**/api/capture", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, captureId: "cap_test_1" }),
    });
  });

  // Mock analyze to avoid OpenAI calls and control the response.
  await page.route("**/api/analyze", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        result: {
          confidence: 0.8,
          cards: [
            { id: "whatIs", title: "O que é este documento", text: "Carta de cobrança." },
            { id: "whatSays", title: "O que diz", text: "Solicita pagamento." },
            { id: "dates", title: "Datas", text: "Vencimento em 10/10/2025." },
            { id: "terms", title: "Termos", text: "Sem termos complexos." },
            { id: "whatUsuallyHappens", title: "O que acontece", text: "Pode haver cobrança adicional." },
          ],
          notice: "Esta explicação é informativa.",
        },
      }),
    });
  });

  // Upload a tiny PNG and follow the main flow.
  await page.goto("/");

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "doc.png",
    mimeType: "image/png",
    buffer: Buffer.from(tinyPngBase64, "base64"),
  });

  await page.waitForURL("**/confirm");
  await page.getByRole("button", { name: "Sim, usar" }).click();
  await page.waitForURL("**/result");

  await expect(page.getByRole("heading", { name: "Explicação", exact: true })).toBeVisible();
  await expect(page.getByText("O que é este documento")).toBeVisible();

  await page.getByRole("button", { name: "Fazer perguntas" }).click();
  await page.waitForURL("**/perguntas");
  await expect(page.getByRole("heading", { name: "Perguntas sobre o documento", level: 5 })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Documento$/ })).toBeVisible();
});

test("error path: analyze returns error", async ({ page }) => {
  // Mock capture to move past the confirm screen.
  await page.route("**/api/capture", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, captureId: "cap_test_2" }),
    });
  });

  // Simulate a backend failure from analyze.
  await page.route("**/api/analyze", async (route) => {
    await route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "Modelo não retornou JSON válido" }),
    });
  });

  // Upload a tiny PNG and ensure the error UI appears.
  await page.goto("/");

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "doc.png",
    mimeType: "image/png",
    buffer: Buffer.from(tinyPngBase64, "base64"),
  });

  await page.waitForURL("**/confirm");
  await page.getByRole("button", { name: "Sim, usar" }).click();

  await expect(page.getByText("Não entendi a foto")).toBeVisible();
});
