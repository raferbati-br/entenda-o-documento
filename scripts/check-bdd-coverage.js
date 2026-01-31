#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

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
  const idRegex = /@id\(([^)]+)\)/g;
  const manualRegex = /@manual\b/;
  const scenarioRegex = /^\s*Scenario:\s*(.+)\s*$/i;
  const results = [];

  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
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
        const name = scenarioMatch[1].trim();
        const ids = pendingIds.length ? pendingIds : [];
        results.push({ feature: rel, scenario: name, ids, manual: pendingManual });
        pendingIds = [];
        pendingManual = false;
      }
    }
  }

  return results;
}

function collectE2ETestContent() {
  const files = readAllFiles(E2E_DIR, (p) => p.endsWith(".spec.ts") || p.endsWith(".spec.tsx"));
  let content = "";
  for (const file of files) {
    content += fs.readFileSync(file, "utf8");
    content += "\n";
  }
  return content;
}

function main() {
  const scenarios = collectBddScenarios();
  const testContent = collectE2ETestContent();

  const missing = [];
  const withoutIds = [];

  for (const scenario of scenarios) {
    if (!scenario.ids.length) {
      withoutIds.push(scenario);
      continue;
    }
    for (const id of scenario.ids) {
      if (scenario.manual) continue;
      if (!testContent.includes(id)) {
        missing.push({ ...scenario, id });
      }
    }
  }

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

  const exitCode = withoutIds.length || missing.length ? 1 : 0;
  process.exit(exitCode);
}

main();
