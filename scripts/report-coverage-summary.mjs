#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import coverageLib from "istanbul-lib-coverage";

const ROOT = process.cwd();
const UNIT_SUMMARY = path.join(ROOT, "coverage", "coverage-summary.json");
const UNIT_COVERAGE_JSON = path.join(ROOT, "coverage", "coverage-final.json");
const E2E_SUMMARY = path.join(ROOT, "test-results", "playwright", "coverage-report", "coverage-summary.json");

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

function readUnitCoverageValue() {
  const summary = readJson(UNIT_SUMMARY);
  if (summary?.total?.lines?.pct !== undefined) {
    return summary.total.lines.pct;
  }

  const coverageMapData = readJson(UNIT_COVERAGE_JSON);
  if (coverageMapData) {
    const { createCoverageMap } = coverageLib;
    const map = createCoverageMap(coverageMapData);
    return map.getCoverageSummary().lines.pct;
  }

  return null;
}

function readE2ECoverageValue() {
  const data = readJson(E2E_SUMMARY);
  const pct = data?.total?.lines?.pct;
  return typeof pct === "number" ? pct : null;
}

function main() {
  const unitValue = formatPercentNumber(readUnitCoverageValue());
  const e2eValue = formatPercentNumber(readE2ECoverageValue());
  const averageValue = unitValue === null || e2eValue === null ? null : (unitValue + e2eValue) / 2;

  const unitPct = formatPercent(unitValue);
  const e2ePct = formatPercent(e2eValue);
  const averagePct = formatPercent(averageValue);

  console.log(`\nResumo de cobertura (Codigo): ${averagePct}`);
  console.log(`Testes Unitarios: ${unitPct}`);
  console.log(`Testes Funcionais: ${e2ePct}`);
}

main();
