#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const UNIT_SUMMARY = path.join(ROOT, "coverage", "unit", "coverage-summary.json");
const UNIT_SUMMARY_FALLBACK = path.join(ROOT, "test-results", "vitest", "coverage-summary.json");
const UNIT_COVERAGE_JSON = path.join(ROOT, "test-results", "vitest", "coverage-all", "coverage-final.json");
const E2E_SUMMARY = path.join(ROOT, "test-results", "playwright", "coverage-report", "coverage-summary.json");
const BDD_SUMMARY = path.join(ROOT, "test-results", "bdd", "coverage-summary.json");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function formatPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(2)}%`;
}

function readUnitCoverage() {
  const summary = readJson(UNIT_SUMMARY) || readJson(UNIT_SUMMARY_FALLBACK);
  if (summary?.total?.lines?.pct !== undefined) {
    return formatPercent(summary.total.lines.pct);
  }

  const coverageMapData = readJson(UNIT_COVERAGE_JSON);
  if (coverageMapData) {
    // Lazy require to avoid loading when not needed.
    // eslint-disable-next-line global-require
    const { createCoverageMap } = require("istanbul-lib-coverage");
    const map = createCoverageMap(coverageMapData);
    const totals = map.getCoverageSummary().lines.pct;
    return formatPercent(totals);
  }

  return "N/A";
}

function readE2ECoverage() {
  const data = readJson(E2E_SUMMARY);
  const pct = data?.total?.lines?.pct;
  return formatPercent(pct);
}

function readBddCoverage() {
  const data = readJson(BDD_SUMMARY);
  const pct = data?.percent;
  return formatPercent(pct);
}

function main() {
  const unitPct = readUnitCoverage();
  const e2ePct = readE2ECoverage();
  const bddPct = readBddCoverage();

  console.log("Resumo de cobertura:");
  console.log(`Cobertura dos Testes Unitarios: ${unitPct}`);
  console.log(`Cobertura dos Testes Funcionais: ${e2ePct}`);
  console.log(`Cobertura dos Cenários de Negocio: ${bddPct}`);
}

main();
