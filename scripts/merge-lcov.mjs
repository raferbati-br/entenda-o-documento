#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const UNIT_LCOV = path.join(ROOT, "coverage", "lcov.info");
const E2E_LCOV = path.join(ROOT, "test-results", "playwright", "coverage-report", "lcov.info");
const OUT_DIR = path.join(ROOT, "test-results", "coverage");
const OUT_LCOV = path.join(OUT_DIR, "lcov.info");

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo LCOV nao encontrado: ${filePath}`);
    process.exit(1);
  }
}

function main() {
  ensureFile(UNIT_LCOV);
  ensureFile(E2E_LCOV);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const merger = path.join(
    ROOT,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "lcov-result-merger.cmd" : "lcov-result-merger"
  );

  const result = spawnSync(
    process.platform === "win32" ? `"${merger}"` : merger,
    [UNIT_LCOV, E2E_LCOV],
    { encoding: "utf8", shell: true }
  );

  if (result.error) {
    console.error(result.error);
  }
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const merged = (result.stdout || "").trim();
  if (!merged) {
    console.error("Nao foi possivel gerar o LCOV combinado.");
    process.exit(1);
  }

  fs.writeFileSync(OUT_LCOV, merged + "\n");
  console.log(`LCOV combinado salvo em ${OUT_LCOV}`);
}

main();
