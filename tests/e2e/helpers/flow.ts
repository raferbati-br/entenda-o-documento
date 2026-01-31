import type { Page } from "@playwright/test";

const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

export async function mockCapture(page: Page, captureId = "cap_test_1") {
  await page.route("**/api/capture", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, captureId }),
    });
  });
}

export async function mockSessionToken(page: Page, token = "session_test") {
  await page.route("**/api/session-token", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, token }),
    });
  });
}

export async function mockAnalyzeSuccess(page: Page) {
  await page.route("**/api/analyze", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        result: {
          confidence: 0.8,
          cards: [
            { id: "whatIs", title: "O que e este documento", text: "Carta de cobranca." },
            { id: "whatSays", title: "O que diz", text: "Solicita pagamento." },
            { id: "dates", title: "Datas", text: "Vencimento em 10/10/2025." },
            { id: "terms", title: "Termos", text: "Sem termos complexos." },
            { id: "whatUsuallyHappens", title: "O que acontece", text: "Pode haver cobranca adicional." },
          ],
          notice: "Esta explicacao e informativa.",
        },
      }),
    });
  });
}

export async function mockAnalyzeError(page: Page) {
  await page.route("**/api/analyze", async (route) => {
    await route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "Modelo nao retornou JSON valido" }),
    });
  });
}

export async function uploadTinyImage(page: Page) {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "doc.png",
    mimeType: "image/png",
    buffer: Buffer.from(tinyPngBase64, "base64"),
  });
}

export async function goToConfirmFromHome(page: Page) {
  await page.goto("/");
  await uploadTinyImage(page);
  await page.waitForURL("**/confirm");
}

export async function goToAnalyzingFromHome(page: Page) {
  await goToConfirmFromHome(page);
  await page.getByRole("button", { name: "Usar esta" }).click();
  await page.waitForURL("**/analyzing");
}

export async function goToResultFromHome(page: Page) {
  await goToAnalyzingFromHome(page);
  await page.waitForURL("**/result", { timeout: 60000 });
}
