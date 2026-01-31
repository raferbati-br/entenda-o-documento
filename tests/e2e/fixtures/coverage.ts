import { test as base, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    if (!process.env.E2E_COVERAGE) {
      await use(page);
      return;
    }

    await page.coverage.startJSCoverage({
      resetOnNavigation: false,
    });

    try {
      await use(page);
    } finally {
      const coverage = await page.coverage.stopJSCoverage();
      const outputDir = path.join(testInfo.project.outputDir, "coverage");
      await fs.mkdir(outputDir, { recursive: true });
      const fileName = `coverage-${testInfo.project.name}-${testInfo.workerIndex}-${Date.now()}.json`;
      const outputPath = path.join(outputDir, fileName);
      await fs.writeFile(outputPath, JSON.stringify(coverage));
    }
  },
});

export { test, expect };
