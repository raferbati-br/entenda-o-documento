const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/unit/**/*.test.(ts|tsx)"],
  testPathIgnorePatterns: ["<rootDir>/tests/unit/page\\..*\\.test\\.tsx$"],
  setupFilesAfterEnv: ["<rootDir>/tests/unit/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/**",
    "!src/ai/prompts/**",
    "!src/ai/providers/**",
    "!src/ai/types.ts",
  ],
  coverageReporters: ["text", "lcov", "json", "json-summary", "html"],
};

module.exports = createJestConfig(customJestConfig);
