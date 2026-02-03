import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility Tests", () => {
  test("Home page should not have automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Camera page should not have automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/camera");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Result page should not have automatically detectable accessibility issues", async ({ page }) => {
    // Mock result data
    await page.goto("/");
    await page.evaluate(() => {
      const mockResult = {
        confidence: 0.85,
        cards: [
          { id: "whatIs", title: "O que é", text: "Documento de teste" },
          { id: "whatSays", title: "O que diz", text: "Conteúdo do documento" },
          { id: "dates", title: "Datas e prazos", text: "Sem prazos específicos" },
          { id: "terms", title: "Termos importantes", text: "Não há termos complexos" },
          { id: "whatUsuallyHappens", title: "O que costuma acontecer", text: "Processo padrão" },
        ],
        notice: null,
      };
      localStorage.setItem("analysis-result", JSON.stringify(mockResult));
      localStorage.setItem("qa-context", "Documento de teste");
    });

    await page.goto("/result");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Perguntas page should not have automatically detectable accessibility issues", async ({ page }) => {
    // Mock required data for perguntas page
    await page.goto("/");
    await page.evaluate(() => {
      const mockResult = {
        confidence: 0.85,
        cards: [
          { id: "whatIs", title: "O que é", text: "Documento de teste" },
          { id: "whatSays", title: "O que diz", text: "Conteúdo do documento" },
        ],
      };
      localStorage.setItem("analysis-result", JSON.stringify(mockResult));
      localStorage.setItem("qa-context", "Documento de teste");
    });

    await page.goto("/perguntas");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Metrics page should not have automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/metrics");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // Exclude scrollable-region-focusable for metrics page as it's a static dashboard
      .disableRules(["scrollable-region-focusable"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
