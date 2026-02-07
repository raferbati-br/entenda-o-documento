#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const COVERAGE_DIR = path.join(ROOT, "coverage");
const SUMMARY_PATH = path.join(COVERAGE_DIR, "coverage-summary.json");
const COVERAGE_JSON = path.join(COVERAGE_DIR, "coverage-final.json");
const DEBUG_DIR = path.join(ROOT, "test-results", "jest");

function parseLinesCoverage(output) {
  const ESC = String.fromCodePoint(27);
  const ansiRegex = new RegExp(String.raw`${ESC}\[[0-9;]*m`, "g");
  const cleanOutput = output.replaceAll(ansiRegex, "");
  const line = cleanOutput
    .split(/\r?\n/)
    .find((entry) => entry.includes("All files"));
  if (!line) {
    const debugPath = path.join(DEBUG_DIR, "coverage-output.txt");
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
    fs.writeFileSync(debugPath, cleanOutput);
    return null;
  }
  const parts = line.split("|").map((entry) => entry.trim());
  if (parts.length < 5) {
    const debugPath = path.join(DEBUG_DIR, "coverage-output.txt");
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
    fs.writeFileSync(debugPath, line);
    return null;
  }
  const linesPct = Number(parts[4]);
  if (!Number.isFinite(linesPct)) {
    const debugPath = path.join(DEBUG_DIR, "coverage-output.txt");
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
    fs.writeFileSync(debugPath, line);
    return null;
  }
  return linesPct;
}

function main() {
  const jestCommand = path.join(
    ROOT,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "jest.cmd" : "jest"
  );
  const result = spawnSync(
    process.platform === "win32" ? `"${jestCommand}"` : jestCommand,
    ["--config", "jest.config.cjs", "--coverage", "--color"],
    {
      encoding: "utf8",
      shell: true,
      env: {
        ...process.env,
        FORCE_COLOR: "1",
      },
    }
  );

  if (result.error) {
    console.error(result.error);
  }

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const combined = `${result.stdout || ""}\n${result.stderr || ""}`;
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
  fs.writeFileSync(path.join(DEBUG_DIR, "coverage-output.txt"), combined);

  // Normalize Windows paths so Sonar can resolve LCOV entries.
  const lcovPath = path.join(COVERAGE_DIR, "lcov.info");
  if (fs.existsSync(lcovPath)) {
    const raw = fs.readFileSync(lcovPath, "utf8");
    const normalized = raw.replaceAll("SF:src\\", "SF:src/").replaceAll("SF:src\\\\", "SF:src/");
    if (normalized !== raw) {
      fs.writeFileSync(lcovPath, normalized);
    }
  }
  let linesPct = null;
  if (fs.existsSync(SUMMARY_PATH)) {
    const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, "utf8"));
    linesPct = summary?.total?.lines?.pct ?? null;
  } else if (fs.existsSync(COVERAGE_JSON)) {
    const summary = JSON.parse(fs.readFileSync(COVERAGE_JSON, "utf8"));
    linesPct = summary?.total?.lines?.pct ?? null;
  }
  if (linesPct === null) {
    linesPct = parseLinesCoverage(combined);
  }
  if (linesPct === null) {
    console.warn("Nao foi possivel extrair cobertura de linhas do resumo do Jest.");
  } else {
    const formatted = Number(linesPct).toFixed(2);
    console.log(`Cobertura dos Testes Unit?rios: ${formatted}%`);
  }

  process.exit(result.status ?? 1);
}

main();
