#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = process.cwd();
const SUMMARY_DIR = path.join(ROOT, "coverage", "unit");
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
  const cleanOutput = output.replace(/\u001b\[[0-9;]*m/g, "");
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
    ["run", "--config", "vitest.config.unit.ts", "--coverage", "--coverage.reporter=text"],
    { encoding: "utf8", shell: true }
  );

  if (result.error) {
    console.error(result.error);
  }

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const combined = `${result.stdout || ""}\n${result.stderr || ""}`;
  fs.mkdirSync(SUMMARY_DIR, { recursive: true });
  fs.writeFileSync(path.join(SUMMARY_DIR, "coverage-output.txt"), combined);
  const linesPct = parseLinesCoverage(combined);
  if (linesPct !== null) {
    writeSummary(linesPct);
  } else {
    console.warn("Nao foi possivel extrair cobertura de linhas do resumo do Vitest.");
  }

  process.exit(result.status ?? 1);
}

main();
