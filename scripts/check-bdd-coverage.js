#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const BDD_DIR = path.join(ROOT, "docs", "bdd");
const E2E_DIR = path.join(ROOT, "tests", "e2e");

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

function collectBddScenarios() {
  const files = readAllFiles(BDD_DIR, (p) => p.endsWith(".feature"));
  return files.flatMap((file) => parseFeatureFile(file));
}

function parseFeatureFile(file) {
  const idRegex = /@id\(([^)]+)\)/g;
  const manualRegex = /@manual\b/;
  const scenarioRegex = /^\s*Scenario:\s*(.+)\s*$/i;
  const rel = path.relative(ROOT, file).replaceAll("\\", "/");
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const results = [];
  let pendingIds = [];
  let pendingManual = false;

  for (const line of lines) {
    let match;
    while ((match = idRegex.exec(line)) !== null) {
      pendingIds.push(match[1].trim());
    }
    if (manualRegex.test(line)) {
      pendingManual = true;
    }

    const scenarioMatch = scenarioRegex.exec(line);
    if (scenarioMatch) {
      results.push({
        feature: rel,
        scenario: scenarioMatch[1].trim(),
        ids: pendingIds.length ? pendingIds : [],
        manual: pendingManual,
      });
      pendingIds = [];
      pendingManual = false;
    }
  }

  return results;
}

function collectE2ETestContent() {
  const files = readAllFiles(E2E_DIR, (p) => p.endsWith(".spec.ts") || p.endsWith(".spec.tsx"));
  return files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
}

function getCoverageGaps(scenarios, testContent) {
  const missing = [];
  const withoutIds = [];

  scenarios.forEach((scenario) => {
    if (!scenario.ids.length) {
      withoutIds.push(scenario);
      return;
    }
    if (scenario.manual) return;
    scenario.ids.forEach((id) => {
      if (!testContent.includes(id)) {
        missing.push({ ...scenario, id });
      }
    });
  });

  return { missing, withoutIds };
}

function printCoverageReport(report) {
  const { missing, withoutIds } = report;
  if (withoutIds.length) {
    console.log("Cenarios sem @id(...) encontrados:");
    for (const item of withoutIds) {
      console.log(`- ${item.feature} :: ${item.scenario}`);
    }
    console.log("");
  }

  if (missing.length) {
    console.log("IDs sem referencia em testes E2E:");
    for (const item of missing) {
      console.log(`- ${item.id} :: ${item.feature} :: ${item.scenario}`);
    }
    console.log("");
  }

  if (!withoutIds.length && !missing.length) {
    console.log("OK: todos os cenarios possuem @id e todos os IDs foram encontrados nos testes E2E.");
  }

  return withoutIds.length || missing.length ? 1 : 0;
}

function main() {
  const scenarios = collectBddScenarios();
  const testContent = collectE2ETestContent();
  const report = getCoverageGaps(scenarios, testContent);
  const exitCode = printCoverageReport(report);
  process.exit(exitCode);
}

main();
