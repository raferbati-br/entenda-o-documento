import { BeforeAll, AfterAll, Before, After, Given, When, Then } from "@cucumber/cucumber";
import { chromium, type Browser, type Page } from "playwright";
import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

let browser: Browser;
let page: Page;
let server: ChildProcessWithoutNullStreams | null = null;

const BASE_URL = "http://localhost:3000";

const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

async function waitForServer(timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Server did not become ready");
}

BeforeAll(async () => {
  server = spawn("npm", ["run", "dev"], { shell: true, stdio: "pipe" });
  await waitForServer();
});

AfterAll(async () => {
  if (server) {
    server.kill();
    server = null;
  }
});

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
  await page.goto(BASE_URL);
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
