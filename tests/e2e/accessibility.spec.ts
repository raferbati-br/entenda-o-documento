import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility tests using Axe-core
 * Tests all main pages for WCAG 2.1 Level AA compliance
 */

test.describe("Accessibility Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  });

  test("Home page should not have accessibility violations", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Confirm page should not have accessibility violations", async ({ page }) => {
    // Navigate to home first to set up any required state
    await page.goto("/");
    
    // Use gallery input to set up the confirm page
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-document.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("fake-image-data"),
    });

    // Wait for navigation to confirm page
    await page.waitForURL("/confirm");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Camera page should not have accessibility violations", async ({ page }) => {
    await page.goto("/camera");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Analyze page should not have accessibility violations", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("eod_capture_id_v1", "test-capture");
    });

    await page.route("**/api/ocr", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, documentText: "" }),
      });
    });

    await page.route("**/api/analyze", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, error: "forced-error" }),
      });
    });

    await page.goto("/analyzing");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Metrics page should not have accessibility violations", async ({ page }) => {
    await page.goto("/metrics");
    await page.waitForFunction(() => {
      const wrapper = document.querySelector('[data-page-transition="true"]');
      return wrapper ? getComputedStyle(wrapper).opacity === "1" : true;
    });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
