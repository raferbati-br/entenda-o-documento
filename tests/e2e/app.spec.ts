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

  await page.route("**/api/ocr", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, documentText: "Texto simulado para OCR." }),
    });
  });

  // Mock analyze stream to avoid OpenAI calls and control the response.
  await page.route("**/api/analyze/stream", async (route) => {
    const result = {
      confidence: 0.8,
      cards: [
        { id: "whatIs", title: "O que é este documento", text: "Carta de cobrança." },
        { id: "whatSays", title: "O que diz", text: "Solicita pagamento." },
        { id: "dates", title: "Datas", text: "Vencimento em 10/10/2025." },
        { id: "terms", title: "Termos", text: "Sem termos complexos." },
        { id: "whatUsuallyHappens", title: "O que acontece", text: "Pode haver cobrança adicional." },
      ],
      notice: "Esta explicação é informativa.",
    };

    const body = [
      JSON.stringify({ type: "card", card: result.cards[0] }),
      JSON.stringify({ type: "result", result }),
      "",
    ].join("\n");

    await route.fulfill({
      status: 200,
      contentType: "application/x-ndjson",
      body,
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
  await page.getByRole("button", { name: "Usar esta imagem" }).click();
  await page.waitForURL(/\/result/);

  await expect(page.getByRole("heading", { name: "Explicação", exact: true })).toBeVisible();
  await expect(page.getByText("O que é este documento")).toBeVisible();

  await page.getByRole("button", { name: "Tirar duvidas" }).click();
  await page.waitForURL("**/perguntas");
  await expect(page.getByRole("heading", { name: "Tire suas duvidas" })).toBeVisible();
  await expect(page.getByLabel("Sua pergunta")).toBeVisible();
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

  await page.route("**/api/ocr", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, documentText: "Texto simulado para OCR." }),
    });
  });

  // Simulate a backend failure from analyze stream.
  await page.route("**/api/analyze/stream", async (route) => {
    await route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "Modelo nÃ£o retornou JSON vÃ¡lido" }),
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
  await page.getByRole("button", { name: "Usar esta imagem" }).click();
  await page.waitForURL(/\/result/);

  await expect(page.getByText("Não entendi a foto")).toBeVisible();
});
