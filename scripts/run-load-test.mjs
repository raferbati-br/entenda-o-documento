import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import readline from "node:readline";

const DEFAULT_PORT = 3100;
const BASE_URL = process.env.BASE_URL || `http://localhost:${DEFAULT_PORT}`;
const baseUrlParsed = new URL(BASE_URL);
const devPort = baseUrlParsed.port ? Number(baseUrlParsed.port) : DEFAULT_PORT;
const CHECK_TIMEOUT_MS = 60_000;

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
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("exit", (code) => resolve(code ?? 1));
  });
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

async function main() {
  const alreadyRunning = await checkServerReady();
  let devProcess = null;
  let devLogCleanup = null;

  if (!alreadyRunning) {
    const devEnv = {
      ...process.env,
      LLM_PROVIDER: "mock",
      ANALYZE_LLM_PROVIDER: "mock",
      API_LOGS: "0",
      APP_ORIGIN: BASE_URL,
    };
    if (process.platform === "win32") {
      devProcess = spawn("cmd.exe", ["/d", "/s", "/c", `npm run dev -- -p ${devPort}`], {
        stdio: ["ignore", "pipe", "pipe"],
        env: devEnv,
      });
    } else {
      devProcess = spawn("npm", ["run", "dev", "--", "-p", String(devPort)], {
        stdio: ["ignore", "pipe", "pipe"],
        env: devEnv,
      });
    }
    const stdoutRl = readline.createInterface({ input: devProcess.stdout });
    const stderrRl = readline.createInterface({ input: devProcess.stderr });
    const ESC = String.fromCodePoint(27);
    const ansiRegex = new RegExp(String.raw`${ESC}\[[0-9;]*m`, "g");
    const shouldSuppressDevLog = (line) => {
      const cleaned = line.replaceAll(ansiRegex, "");
      const trimmed = cleaned.trimStart();
      return /^(GET|POST|PUT|DELETE|PATCH)\s/.test(trimmed);
    };
    stdoutRl.on("line", (line) => {
      if (!shouldSuppressDevLog(line)) {
        process.stdout.write(`${line}\n`);
      }
    });
    stderrRl.on("line", (line) => {
      if (!shouldSuppressDevLog(line)) {
        process.stderr.write(`${line}\n`);
      }
    });
    devLogCleanup = () => {
      stdoutRl.close();
      stderrRl.close();
    };
    const ready = await waitForServer();
    if (!ready) {
      await stopProcessTree(devProcess.pid);
      throw new Error(`Dev server did not become ready on ${BASE_URL}`);
    }
  }

  const scriptPath = "tests/load/k6/capture-analyze.js";
  const scenarioName = "LOAD-1 - Captura + analise basica";
  const bannerLine = "=".repeat(72);
  console.log(`\n${bannerLine}`);
  console.log("LOAD TEST");
  console.log(`Scenario: ${scenarioName}`);
  console.log(`Script: ${scriptPath}`);
  console.log(`${bannerLine}\n`);
  const exitCode = await runCommand("k6", ["run", scriptPath], {
    env: { ...process.env, BASE_URL },
  });

  if (devProcess) {
    await stopProcessTree(devProcess.pid);
    if (devLogCleanup) devLogCleanup();
  }

  const scriptName = path.basename(scriptPath);
  const statusLabel = exitCode === 0 ? "sucesso" : `falha (exit ${exitCode})`;
  console.log("\nResumo dos Testes de Carga:");
  console.log(`Cenario: ${scenarioName}: (${scriptName}): ${statusLabel}`);

  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
