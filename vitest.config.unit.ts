import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    exclude: ["tests/unit/page.*.test.tsx"],
    environment: "node",
    environmentMatchGlobs: [["tests/unit/**/*.test.tsx", "jsdom"]],
    globals: true,
    setupFiles: ["tests/unit/vitest.setup.ts"],
    reporters: ["default", "junit"],
    outputFile: {
      junit: "test-results/vitest/junit.xml",
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/app/**",
        "src/ai/prompts/**",
        "src/ai/providers/**",
        "src/ai/types.ts",
      ],
      reporter: ["text", "lcov", "json", "json-summary", "html"],
      reportsDirectory: "test-results/vitest/coverage-all",
    },
  },
});
