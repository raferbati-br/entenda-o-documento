#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const SUMMARY_DIR = path.join(ROOT, "test-results", "vitest", "coverage-all");
const SUMMARY_PATH = path.join(SUMMARY_DIR, "coverage-summary.json");

function writeSummary(linesPct) {
  fs.mkdirSync(SUMMARY_DIR, { recursive: true });
  const payload = {
    total: {
      lines: {
        pct: linesPct,
      },
    },
  };
  fs.writeFileSync(SUMMARY_PATH, JSON.stringify(payload, null, 2));
}

function parseLinesCoverage(output) {
  const ESC = String.fromCodePoint(27);
  const ansiRegex = new RegExp(String.raw`${ESC}\[[0-9;]*m`, "g");
  const cleanOutput = output.replaceAll(ansiRegex, "");
  const line = cleanOutput
    .split(/\r?\n/)
    .find((entry) => entry.includes("All files"));
  if (!line) {
    const debugPath = path.join(SUMMARY_DIR, "coverage-output.txt");
    fs.mkdirSync(SUMMARY_DIR, { recursive: true });
    fs.writeFileSync(debugPath, cleanOutput);
    return null;
  }
  const parts = line.split("|").map((entry) => entry.trim());
  if (parts.length < 5) {
    const debugPath = path.join(SUMMARY_DIR, "coverage-output.txt");
    fs.mkdirSync(SUMMARY_DIR, { recursive: true });
    fs.writeFileSync(debugPath, line);
    return null;
  }
  const linesPct = Number(parts[4]);
  if (!Number.isFinite(linesPct)) {
    const debugPath = path.join(SUMMARY_DIR, "coverage-output.txt");
    fs.mkdirSync(SUMMARY_DIR, { recursive: true });
    fs.writeFileSync(debugPath, line);
    return null;
  }
  return linesPct;
}

function main() {
  const vitestCommand = path.join(
    ROOT,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "vitest.cmd" : "vitest"
  );
  const result = spawnSync(
    process.platform === "win32" ? `"${vitestCommand}"` : vitestCommand,
    ["run", "--config", "vitest.config.unit.ts", "--coverage", "--color"],
    {
      encoding: "utf8",
      shell: true,
      env: {
        ...process.env,
        FORCE_COLOR: "1",
        VITEST_FORCE_COLOR: "1",
      },
    }
  );

  if (result.error) {
    console.error(result.error);
  }

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const combined = `${result.stdout || ""}\n${result.stderr || ""}`;
  fs.mkdirSync(SUMMARY_DIR, { recursive: true });
  fs.writeFileSync(path.join(SUMMARY_DIR, "coverage-output.txt"), combined);

  // Normalize Windows paths so Sonar can resolve LCOV entries.
  const lcovPath = path.join(SUMMARY_DIR, "lcov.info");
  if (fs.existsSync(lcovPath)) {
    const raw = fs.readFileSync(lcovPath, "utf8");
    const normalized = raw.replaceAll("SF:src\\", "SF:src/").replaceAll("SF:src\\\\", "SF:src/");
    if (normalized !== raw) {
      fs.writeFileSync(lcovPath, normalized);
    }
  }
  const linesPct = parseLinesCoverage(combined);
  if (linesPct === null) {
    console.warn("Nao foi possivel extrair cobertura de linhas do resumo do Vitest.");
  } else {
    writeSummary(linesPct);
    const formatted = linesPct.toFixed(2);
    console.log(`Cobertura dos Testes Unitários: ${formatted}%`);
  }

  process.exit(result.status ?? 1);
}

main();
