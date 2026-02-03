import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import readline from "node:readline";

const DEFAULT_PORT = 3100;
const BASE_URL = process.env.BASE_URL || `http://localhost:${DEFAULT_PORT}`;
const baseUrlParsed = new URL(BASE_URL);
const devPort = baseUrlParsed.port ? Number(baseUrlParsed.port) : DEFAULT_PORT;
const CHECK_TIMEOUT_MS = 60_000;
const WARMUP_TIMEOUT_MS = 120_000;

const warmupImageBase64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

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

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function warmupServer() {
  const tokenRes = await fetchWithTimeout(`${BASE_URL}/api/session-token`, {
    headers: { Origin: BASE_URL },
  });
  const tokenJson = tokenRes ? await tokenRes.json().catch(() => null) : null;
  const token = tokenJson?.token || "";
  if (!token) return false;

  const captureRes = await fetchWithTimeout(`${BASE_URL}/api/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-session-token": token,
      Origin: BASE_URL,
    },
    body: JSON.stringify({ imageBase64: warmupImageBase64 }),
  });
  return Boolean(captureRes && captureRes.ok);
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
    const tokenSecret = process.env.API_TOKEN_SECRET || "local-load-test-secret";
    const rateLimitMax = process.env.RATE_LIMIT_MAX_PER_WINDOW || "100000";
    const rateLimitWindow = process.env.RATE_LIMIT_WINDOW_SECONDS || "60";
    const captureMaxCount = process.env.CAPTURE_MAX_COUNT || "100000";
    const captureMaxTotalBytes = process.env.CAPTURE_MAX_TOTAL_BYTES || String(1024 * 1024 * 1024);
    const devEnv = {
      ...process.env,
      LLM_PROVIDER: "mock",
      ANALYZE_LLM_PROVIDER: "mock",
      API_LOGS: "0",
      API_TOKEN_SECRET: tokenSecret,
      APP_ORIGIN: BASE_URL,
      RATE_LIMIT_MAX_PER_WINDOW: rateLimitMax,
      RATE_LIMIT_WINDOW_SECONDS: rateLimitWindow,
      CAPTURE_MAX_COUNT: captureMaxCount,
      CAPTURE_MAX_TOTAL_BYTES: captureMaxTotalBytes,
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

    const warmed = await warmupServer();
    if (!warmed) {
      console.warn("[load-test] Warmup falhou ou demorou demais; seguindo mesmo assim.");
    }
  } else if (!process.env.RATE_LIMIT_MAX_PER_WINDOW && process.env.RATE_LIMIT_DISABLED !== "1") {
    console.warn("[load-test] Servidor já em execução; rate limit pode estar baixo para testes de carga.");
  }

  const scenarios = [
    { id: "LOAD-1", name: "Captura + analise basica", script: "tests/load/k6/capture-analyze.js" },
    { id: "LOAD-2", name: "OCR dedicado", script: "tests/load/k6/ocr.js" },
    { id: "LOAD-3", name: "Q&A streaming", script: "tests/load/k6/qa-stream.js" },
    { id: "LOAD-4", name: "Feedback", script: "tests/load/k6/feedback.js" },
    { id: "LOAD-5", name: "Stress de captura (picos)", script: "tests/load/k6/stress-capture.js" },
    { id: "LOAD-6", name: "Stress de analise (picos)", script: "tests/load/k6/stress-analyze.js" },
    { id: "LOAD-7", name: "Redis (rate limit)", script: "tests/load/k6/rate-limit.js" },
    { id: "LOAD-8", name: "Armazenamento em memoria (capturas)", script: "tests/load/k6/memory-long-run.js" },
    { id: "LOAD-9", name: "Provedor real (LLM)", script: "tests/load/k6/llm-real.js" },
    { id: "LOAD-10", name: "Qualidade do resultado (amostra valida)", script: "tests/load/k6/quality-assert.js" },
  ];

  const filterId = (process.env.LOAD_ID || "").trim();
  const filterScript = (process.env.LOAD_SCRIPT || "").trim();
  const selected = scenarios.filter((scenario) => {
    if (!filterId && !filterScript) return true;
    const scriptName = path.basename(scenario.script);
    return scenario.id === filterId || scenario.script === filterScript || scriptName === filterScript;
  });

  if (!selected.length) {
    throw new Error("Nenhum cenario selecionado. Use LOAD_ID ou LOAD_SCRIPT para filtrar.");
  }

  const results = [];
  for (const scenario of selected) {
    const bannerLine = "=".repeat(72);
    console.log(`\n${bannerLine}`);
    console.log("LOAD TEST");
    console.log(`Scenario: ${scenario.id} - ${scenario.name}`);
    console.log(`Script: ${scenario.script}`);
    console.log(`${bannerLine}\n`);
    const exitCode = await runCommand("k6", ["run", scenario.script], {
      env: { ...process.env, BASE_URL },
    });
    results.push({ scenario, exitCode });
  }

  if (devProcess) {
    await stopProcessTree(devProcess.pid);
    if (devLogCleanup) devLogCleanup();
  }

  console.log("\nResumo dos Testes de Carga:");
  let hasFailure = false;
  for (const { scenario, exitCode } of results) {
    const scriptName = path.basename(scenario.script);
    const statusLabel = exitCode === 0 ? "sucesso" : `falha (exit ${exitCode})`;
    if (exitCode !== 0) hasFailure = true;
    console.log(`Cenario: ${scenario.id} - ${scenario.name}: (${scriptName}): ${statusLabel}`);
  }

  if (hasFailure) process.exit(1);
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
