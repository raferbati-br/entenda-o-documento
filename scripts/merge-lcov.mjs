#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const UNIT_LCOV = path.join(ROOT, "coverage", "lcov.info");
const E2E_LCOV = path.join(ROOT, "test-results", "playwright", "coverage-report", "lcov.info");
const OUT_DIR = path.join(ROOT, "test-results", "coverage");
const OUT_LCOV = path.join(OUT_DIR, "lcov.info");
const TMP_DIR = path.join(OUT_DIR, "tmp-merge");

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
  fs.mkdirSync(TMP_DIR, { recursive: true });

  const unitTmp = path.join(TMP_DIR, "unit.lcov.info");
  const e2eTmp = path.join(TMP_DIR, "e2e.lcov.info");
  fs.copyFileSync(UNIT_LCOV, unitTmp);
  fs.copyFileSync(E2E_LCOV, e2eTmp);

  const merger = path.join(
    ROOT,
    "node_modules",
    "lcov-result-merger",
    "bin",
    "lcov-result-merger.js"
  );

  const globPattern = `${TMP_DIR.split(path.sep).join("/")}` + "/*.info";
  const result = spawnSync(
    process.execPath,
    [merger, globPattern, OUT_LCOV],
    { encoding: "utf8" }
  );

  if (result.error) {
    console.error(result.error);
  }
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (!fs.existsSync(OUT_LCOV) || fs.statSync(OUT_LCOV).size === 0) {
    console.error("Nao foi possivel gerar o LCOV combinado.");
    process.exit(1);
  }
  console.log(`LCOV combinado salvo em ${OUT_LCOV}`);
}

main();
