#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BDD_DIR = path.join(ROOT, "docs", "bdd");
const LOAD_MATRIX = path.join(ROOT, "docs", "bdd", "coverage-matrix.md");
const OUTPUT_DIR = path.join(ROOT, "test-results", "load");
const SUMMARY_PATH = path.join(OUTPUT_DIR, "coverage-summary.json");

function readLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/);
}

function collectLoadIdsFromMatrix() {
  const lines = readLines(LOAD_MATRIX);
  const ids = new Set();
  const rowRegex = /^\|\s*(LOAD-\d+)\s*\|/;
  lines.forEach((line) => {
    const match = rowRegex.exec(line);
    if (match) ids.add(match[1]);
  });
  return ids;
}

function collectLoadTagsFromBdd() {
  const files = fs
    .readdirSync(BDD_DIR)
    .filter((file) => file.endsWith(".feature"))
    .map((file) => path.join(BDD_DIR, file));

  const tagRegex = /@load\(([^)]+)\)/g;
  const ids = new Set();
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      ids.add(match[1].trim());
    }
  }
  return ids;
}

function computeCoverage(matrixIds, bddIds) {
  const missing = [];
  matrixIds.forEach((id) => {
    if (!bddIds.has(id)) missing.push(id);
  });
  const total = matrixIds.size;
  const covered = total - missing.length;
  const percent = total ? (covered / total) * 100 : 100;
  return { total, covered, missing, percent: Number(percent.toFixed(2)) };
}

function writeSummary(summary) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2));
}

function main() {
  const matrixIds = collectLoadIdsFromMatrix();
  const bddIds = collectLoadTagsFromBdd();
  const summary = computeCoverage(matrixIds, bddIds);
  writeSummary(summary);

  if (summary.missing.length) {
    console.log("Cenarios de carga sem tag @load no BDD:");
    summary.missing.forEach((id) => console.log(`- ${id}`));
  } else {
    console.log("OK: todos os cenarios da matriz de carga estao referenciados no BDD.");
  }

  process.exit(0);
}

main();
