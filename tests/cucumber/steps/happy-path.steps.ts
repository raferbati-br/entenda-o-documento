import { Before, After, Given, When, Then } from "@cucumber/cucumber";
import { chromium, type Browser, type Page } from "playwright";
import assert from "node:assert/strict";

let browser: Browser;
let page: Page;

const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

Before(async () => {
  browser = await chromium.launch();
  page = await browser.newPage();

  await page.route("**/api/capture", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, captureId: "cap_test_cucumber" }),
    });
  });

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
});

After(async () => {
  await page?.close();
  await browser?.close();
});

Given("I open the home page", async () => {
  await page.goto("http://localhost:3000");
});

When("I upload a tiny document image", async () => {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "doc.png",
    mimeType: "image/png",
    buffer: Buffer.from(tinyPngBase64, "base64"),
  });
});

When("I confirm the photo", async () => {
  await page.waitForURL("**/confirm");
  await page.getByRole("button", { name: "Sim, usar" }).click();
});

Then("I should see the explanation result", async () => {
  await page.waitForURL("**/result");
  const heading = page.getByRole("heading", { name: "Explicação", exact: true });
  assert.ok(await heading.isVisible());
});
