import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    reporters: ["default", "junit"],
    outputFile: {
      junit: "test-results/vitest/junit.xml",
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts"],
      reporter: ["text", "lcov", "json", "html"],
      reportsDirectory: "test-results/vitest/coverage-all",
    },
  },
});
