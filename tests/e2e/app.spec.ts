import { test, expect } from "./fixtures/coverage";

const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

test("happy path: analyze document and show result @id(E2E-1) @id(E2E-3) @id(E2E-5) @id(E2E-9) @id(E2E-11) @id(E2E-13) @id(E2E-17) @id(E2E-25) @id(E2E-26)", async ({ page }) => {
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

  await expect(page.getByRole("heading", { name: "Entenda qualquer documento num piscar de olhos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Galeria" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tirar foto" })).toBeVisible();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "doc.png",
    mimeType: "image/png",
    buffer: Buffer.from(tinyPngBase64, "base64"),
  });

  await page.waitForURL("**/confirm");
  await expect(page.getByAltText("Captura")).toBeVisible();
  await page.getByRole("button", { name: "Usar esta" }).click();
  await page.waitForURL("**/result");

  await expect(page.getByRole("heading", { name: "Explicação", exact: true })).toBeVisible();
  await expect(page.getByText("O que é este documento")).toBeVisible();

  await page.getByRole("button", { name: "Tirar duvidas" }).click();
  await page.waitForURL("**/perguntas");
  await expect(page.getByRole("heading", { name: "Tire suas duvidas", exact: true })).toBeVisible();
  await expect(page.getByLabel("Sua pergunta")).toBeVisible();
});

test("error path: analyze returns error @id(E2E-2) @id(E2E-14)", async ({ page }) => {
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
  await page.getByRole("button", { name: "Usar esta" }).click();

  await expect(page.getByText("Não entendi a foto")).toBeVisible();
});
