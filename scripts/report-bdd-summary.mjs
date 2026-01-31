#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BDD_SUMMARY = path.join(ROOT, "test-results", "bdd", "coverage-summary.json");
const LOAD_SUMMARY = path.join(ROOT, "test-results", "load", "coverage-summary.json");
const LOAD_MATRIX = path.join(ROOT, "docs", "requirements", "coverage-matrix.md");
const LOAD_BDD_DIR = path.join(ROOT, "docs", "requirements", "non-functional");
const LOAD_SCRIPTS_DIR = path.join(ROOT, "tests", "load");
const LOAD_RUNNER = path.join(ROOT, "scripts", "run-load-test.mjs");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function formatPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(2)}%`;
}

function formatPercentNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Number(value.toFixed(2));
}

function readLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/);
}

function readAllFiles(dir, predicate) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...readAllFiles(full, predicate));
      continue;
    }
    if (!predicate || predicate(full)) files.push(full);
  }
  return files;
}

function computeLoadCoverageFallback() {
  const idsFromMatrix = new Set();
  const rowRegex = /^\|\s*(LOAD-\d+)\s*\|/;
  readLines(LOAD_MATRIX).forEach((line) => {
    const match = rowRegex.exec(line);
    if (match) idsFromMatrix.add(match[1]);
  });

  const bddIds = new Set();
  const bddFiles = readAllFiles(LOAD_BDD_DIR, (p) => p.endsWith(".feature"));
  const bddRegex = /@id\((LOAD-\d+)\)/g;
  for (const file of bddFiles) {
    const content = fs.readFileSync(file, "utf8");
    let match;
    while ((match = bddRegex.exec(content)) !== null) {
      bddIds.add(match[1]);
    }
  }

  const scriptIds = new Set();
  const scriptFiles = [
    ...readAllFiles(LOAD_SCRIPTS_DIR, (p) => p.endsWith(".js") || p.endsWith(".mjs")),
    ...(fs.existsSync(LOAD_RUNNER) ? [LOAD_RUNNER] : []),
  ];
  const idRegex = /LOAD-\d+/g;
  for (const file of scriptFiles) {
    const content = fs.readFileSync(file, "utf8");
    let match;
    while ((match = idRegex.exec(content)) !== null) {
      scriptIds.add(match[0]);
    }
  }

  const total = idsFromMatrix.size;
  let covered = 0;
  idsFromMatrix.forEach((id) => {
    if (bddIds.has(id) && scriptIds.has(id)) covered += 1;
  });
  const percent = total ? (covered / total) * 100 : 100;
  return percent;
}

function main() {
  const bdd = readJson(BDD_SUMMARY);
  const load = readJson(LOAD_SUMMARY);

  const bddValue = formatPercentNumber(bdd?.percent);
  const loadValue = formatPercentNumber(load?.percent ?? computeLoadCoverageFallback());
  const averageValue = bddValue === null || loadValue === null ? null : (bddValue + loadValue) / 2;

  const bddPct = formatPercent(bddValue);
  const loadPct = formatPercent(loadValue);
  const averagePct = formatPercent(averageValue);

  console.log(`\nResumo de cobertura (Negocio): ${averagePct}`);
  console.log(`Cenarios Funcionais cobertos: ${bddPct}`);
  console.log(`Cenarios Nao Funcionais cobertos: ${loadPct}`);
}

main();
