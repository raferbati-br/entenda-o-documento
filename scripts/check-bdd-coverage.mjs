#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BDD_DIR = path.join(ROOT, "docs", "req", "funcional");
const E2E_DIR = path.join(ROOT, "tests", "e2e");
const BDD_RESULTS_DIR = path.join(ROOT, "test-results", "bdd");
const BDD_SUMMARY_PATH = path.join(BDD_RESULTS_DIR, "coverage-summary.json");

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
  const allIds = new Set();
  const manualIds = new Set();
  const coveredIds = new Set();

  scenarios.forEach((scenario) => {
    if (!scenario.ids.length) {
      withoutIds.push(scenario);
      return;
    }
    scenario.ids.forEach((id) => {
      allIds.add(id);
      if (scenario.manual) {
        manualIds.add(id);
        return;
      }
      if (testContent.includes(id)) {
        coveredIds.add(id);
      } else {
        missing.push({ ...scenario, id });
      }
    });
  });

  return { missing, withoutIds, allIds, manualIds, coveredIds };
}

function printCoverageReport(report) {
  const { missing, withoutIds, allIds, manualIds, coveredIds } = report;
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

  const eligibleIds = new Set([...allIds].filter((id) => !manualIds.has(id)));
  const total = eligibleIds.size;
  const covered = [...coveredIds].filter((id) => eligibleIds.has(id)).length;
  const percent = total ? (covered / total) * 100 : 100;
  console.log(`Cenarios Funcionais: ${percent.toFixed(2)}%`);

  return withoutIds.length || missing.length ? 1 : 0;
}

function writeSummary(report) {
  const { allIds, manualIds, coveredIds } = report;
  const eligibleIds = new Set([...allIds].filter((id) => !manualIds.has(id)));
  const total = eligibleIds.size;
  const covered = [...coveredIds].filter((id) => eligibleIds.has(id)).length;
  const percent = total ? (covered / total) * 100 : 100;

  const payload = {
    total,
    covered,
    percent: Number(percent.toFixed(2)),
    manual: manualIds.size,
  };

  fs.mkdirSync(BDD_RESULTS_DIR, { recursive: true });
  fs.writeFileSync(BDD_SUMMARY_PATH, JSON.stringify(payload, null, 2));
}

function main() {
  const scenarios = collectBddScenarios();
  const testContent = collectE2ETestContent();
  const report = getCoverageGaps(scenarios, testContent);
  writeSummary(report);
  const exitCode = printCoverageReport(report);
  process.exit(exitCode);
}

main();
