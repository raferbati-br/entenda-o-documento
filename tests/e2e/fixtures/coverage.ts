import { test as base } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const test = base.extend({
  page: async ({ page }, runFixture, testInfo) => {
    if (!process.env.E2E_COVERAGE) {
      await runFixture(page);
      return;
    }

    await page.coverage.startJSCoverage({
      resetOnNavigation: false,
    });

    try {
      await runFixture(page);
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

export { test };
export { expect } from "@playwright/test";
