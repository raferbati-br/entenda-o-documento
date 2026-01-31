#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const ROOT = process.cwd();
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(ROOT, "test-results", "zap");
const ZAP_PATH = process.env.ZAP_PATH;
const DEFAULT_ZAP_HOME = "C:\\Program Files\\ZAP\\Zed Attack Proxy";
const ZAP_HOME = process.env.ZAP_HOME || DEFAULT_ZAP_HOME;
const ZAP_BAT_FALLBACK = "zap.bat";
const ZAP_BASELINE_WINDOWS = "zap-baseline.cmd";
const ZAP_BASELINE_UNIX = "zap-baseline.py";
const CHECK_TIMEOUT_MS = 60_000;
const BUILD_TIMEOUT_MS = 10 * 60_000;
const START_COMMAND = ["run", "start", "--", "-p", "3000"];
const AUTOMATION_PLAN = path.join(OUTPUT_DIR, "zap-automation.yaml");

function checkServerReady() {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL, { timeout: 2000 }, (res) => {
      res.resume();
      resolve(res.statusCode && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < CHECK_TIMEOUT_MS) {
    if (await checkServerReady()) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

function runCommand(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: true, ...opts });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

async function runBuild() {
  const result = await runCommand("npm", ["run", "build"], {
    env: {
      ...process.env,
      APP_ORIGIN: BASE_URL,
    },
    timeout: BUILD_TIMEOUT_MS,
  });
  if (result !== 0) {
    throw new Error("Build falhou. Corrija os erros antes de rodar o scan de seguranca.");
  }
}

async function stopProcessTree(pid) {
  if (!pid) return;
  if (process.platform === "win32") {
    await runCommand("taskkill", ["/PID", String(pid), "/T", "/F"]);
    return;
  }
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    // Ignore failures during cleanup.
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeAutomationPlan() {
  const outputDir = OUTPUT_DIR.replace(/\\/g, "/");
  const baseUrl = BASE_URL.replace(/\/$/, "");
  const escaped = (value) => value.replace(/\\/g, "/");

  const plan = `---
env:
  contexts:
    - name: default
      urls:
        - ${baseUrl}
      includePaths:
        - ${baseUrl}/.*
      excludePaths:
        - ${baseUrl}/_next/static/.*
  parameters:
    failOnError: true
    failOnWarning: false
    continueOnFailure: false
    progressToStdout: true
jobs:
  - type: spider
    parameters:
      context: default
      url: ${baseUrl}
      maxDuration: 2
  - type: activeScan
    parameters:
      context: default
      url: ${baseUrl}
      maxScanDurationInMins: 5
  - type: passiveScan-wait
    parameters:
      maxDuration: 5
  - type: alertFilter
    parameters:
      deleteGlobalAlerts: true
    alertFilters:
      - ruleId: 10096
        newRisk: "False Positive"
        url: ".*/_next/static/.*"
        urlRegex: true
  - type: report
    parameters:
      reportDir: ${escaped(outputDir)}
      reportFile: zap-report.html
`;

  fs.writeFileSync(AUTOMATION_PLAN, plan, "utf8");
}

function resolveZapScript() {
  if (ZAP_PATH) return ZAP_PATH;
  if (!ZAP_HOME) return null;
  const scriptName = process.platform === "win32" ? ZAP_BASELINE_WINDOWS : ZAP_BASELINE_UNIX;
  return path.join(ZAP_HOME, scriptName);
}

function runZapBaselineLocal() {
  const zapScript = resolveZapScript();
  const hasBaseline = zapScript && fs.existsSync(zapScript);

  const args = [
    "-t",
    BASE_URL,
    "-r",
    "zap-report.html",
    "-x",
    "zap-report.xml",
    "-J",
    "zap-report.json",
    "-m",
    "5",
  ];

  const isWindows = process.platform === "win32";
  let cmd = isWindows ? "cmd" : zapScript;
  let cmdArgs = isWindows ? ["/c", zapScript, ...args] : args;

  if (!hasBaseline) {
    if (!ZAP_PATH && !ZAP_HOME) {
      console.error("ZAP local nao encontrado. Defina ZAP_PATH ou ZAP_HOME.");
      process.exit(1);
    }
    if (isWindows) {
      const zapBat = ZAP_PATH && ZAP_PATH.endsWith(".bat") ? ZAP_PATH : path.join(ZAP_HOME || "", ZAP_BAT_FALLBACK);
      if (!fs.existsSync(zapBat)) {
        console.error("Nao encontrei zap-baseline.cmd nem zap.bat. Verifique o caminho do ZAP.");
        process.exit(1);
      }
      writeAutomationPlan();
      cmd = "cmd";
      cmdArgs = ["/c", zapBat, "-cmd", "-autorun", AUTOMATION_PLAN];
      const result = spawnSync(cmd, cmdArgs, { stdio: "inherit", cwd: ZAP_HOME });
      if (result.error) {
        console.error(result.error);
      }
      process.exit(result.status ?? 1);
    } else {
      console.error("Nao encontrei zap-baseline.py. Defina ZAP_PATH para o script correto.");
      process.exit(1);
    }
  }

  const result = spawnSync(cmd, cmdArgs, { stdio: "inherit", cwd: OUTPUT_DIR });
  if (result.error) {
    console.error(result.error);
  }
  return result.status ?? 1;
}

async function main() {
  ensureDir(OUTPUT_DIR);
  console.log(`Running OWASP ZAP baseline against ${BASE_URL}`);
  const alreadyRunning = await checkServerReady();
  let devProcess = null;

  if (!alreadyRunning) {
    await runBuild();
    devProcess = spawn("npm", START_COMMAND, {
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        APP_ORIGIN: BASE_URL,
      },
    });
    const ready = await waitForServer();
    if (!ready) {
      await stopProcessTree(devProcess.pid);
      throw new Error(`Dev server did not become ready on ${BASE_URL}`);
    }
  }

  const exitCode = runZapBaselineLocal();

  if (devProcess) {
    await stopProcessTree(devProcess.pid);
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
