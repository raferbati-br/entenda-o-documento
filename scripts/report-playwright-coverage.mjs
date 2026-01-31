import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fsSync from "node:fs";
import istanbulCoverage from "istanbul-lib-coverage";
import istanbulReport from "istanbul-lib-report";
import istanbulReports from "istanbul-reports";
import convertSourceMap from "convert-source-map";
import { FlattenMap } from "@jridgewell/trace-mapping";
import v8ToIstanbul from "v8-to-istanbul";

const PROJECT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(PROJECT_ROOT, "..");
const TEST_RESULTS_DIR = path.join(REPO_ROOT, "test-results");
const REPORT_DIR = path.join(TEST_RESULTS_DIR, "playwright", "coverage-report");
const SOURCE_ROOT = path.join(REPO_ROOT, "src");

async function listCoverageFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listCoverageFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name.startsWith("coverage-") && entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizeCoveragePath(filePath) {
  if (!filePath) return null;
  if (filePath.startsWith("webpack://")) {
    const cleaned = filePath.replace(/^webpack:\/\//, "").replace(/^\/+/, "");
    return path.join(REPO_ROOT, cleaned);
  }
  if (filePath.startsWith("file://")) {
    return fileURLToPath(filePath);
  }
  return filePath;
}

function isSourceFile(filePath) {
  const normalized = normalizeCoveragePath(filePath);
  if (!normalized) return false;
  const normalizedPath = path.normalize(normalized);
  return normalizedPath.startsWith(SOURCE_ROOT + path.sep);
}

function toLocalPath(scriptUrl) {
  if (!scriptUrl) return null;
  if (scriptUrl.startsWith("http://") || scriptUrl.startsWith("https://")) {
    const { pathname } = new URL(scriptUrl);
    if (!pathname.startsWith("/_next/")) return null;
    const rel = pathname.replace(/^\/_next\//, "");
    const devCandidate = path.join(REPO_ROOT, ".next", "dev", rel);
    const prodCandidate = path.join(REPO_ROOT, ".next", rel);
    return { devCandidate, prodCandidate };
  }
  if (scriptUrl.startsWith("file://")) {
    return { devCandidate: fileURLToPath(scriptUrl), prodCandidate: fileURLToPath(scriptUrl) };
  }
  return null;
}

function loadSourceMap(rawSource, localPath) {
  const map = convertSourceMap.fromSource(rawSource) ||
    convertSourceMap.fromMapFileSource(rawSource, (file) =>
      fsSync.readFileSync(path.resolve(path.dirname(localPath), file), "utf8")
    );
  if (!map || !map.sourcemap) return null;
  if (map.sourcemap && map.sourcemap.sections) {
    return { sourcemap: new FlattenMap(map.sourcemap) };
  }
  return map;
}

async function loadV8Coverage(files) {
  const entries = [];
  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const json = JSON.parse(raw);
    if (Array.isArray(json)) {
      entries.push(...json);
    }
  }
  return entries;
}

async function convertCoverage(entries) {
  const { createCoverageMap } = istanbulCoverage;
  const map = createCoverageMap({});

  for (const entry of entries) {
    const candidates = toLocalPath(entry.url);
    if (!candidates) continue;
    let localPath = "";
    try {
      await fs.access(candidates.devCandidate);
      localPath = candidates.devCandidate;
    } catch {
      try {
        await fs.access(candidates.prodCandidate);
        localPath = candidates.prodCandidate;
      } catch {
        localPath = "";
      }
    }
    if (!localPath) continue;
    let source = "";
    try {
      source = await fs.readFile(localPath, "utf8");
    } catch {
      continue;
    }

    const sourceMap = loadSourceMap(source, localPath);
    let converter;
    try {
      converter = v8ToIstanbul(localPath, 0, { source, sourceMap: sourceMap || undefined });
      await converter.load();
    } catch {
      converter = v8ToIstanbul(localPath, 0, { source });
      await converter.load();
    }
    converter.applyCoverage(entry.functions);
    map.merge(converter.toIstanbul());
  }

  return map;
}

async function main() {
  let coverageFiles = [];
  try {
    coverageFiles = await listCoverageFiles(TEST_RESULTS_DIR);
  } catch {
    coverageFiles = [];
  }

  if (!coverageFiles.length) {
    console.error("No Playwright coverage files found. Did you run with E2E_COVERAGE=1?");
    process.exit(1);
  }

  const entries = await loadV8Coverage(coverageFiles);
  const map = await convertCoverage(entries);

  if (!Object.keys(map.data).length) {
    console.error("No coverage data could be mapped. Ensure .next artifacts exist and source maps are available.");
    process.exit(1);
  }

  const { createCoverageMap } = istanbulCoverage;
  const filteredMap = createCoverageMap({});
  map.files().forEach((file) => {
    if (!isSourceFile(file)) return;
    const normalized = normalizeCoveragePath(file);
    const data = map.fileCoverageFor(file).toJSON();
    data.path = normalized;
    filteredMap.addFileCoverage(data);
  });

  if (!filteredMap.files().length) {
    console.error("No source files were matched under src/. Coverage was generated only for bundles.");
    process.exit(1);
  }

  await fs.mkdir(REPORT_DIR, { recursive: true });
  const { createContext } = istanbulReport;
  const context = createContext({
    dir: REPORT_DIR,
    coverageMap: filteredMap,
  });

  const reportList = ["text", "html", "lcov", "json-summary"];
  reportList.forEach((name) => istanbulReports.create(name).execute(context));

  console.log(`Playwright coverage report generated at ${REPORT_DIR}`);
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
