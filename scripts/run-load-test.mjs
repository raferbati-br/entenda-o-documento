import http from "node:http";
import { spawn } from "node:child_process";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
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
    const child = spawn(cmd, args, { stdio: "inherit", shell: true, ...opts });
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

  if (!alreadyRunning) {
    devProcess = spawn("npm", ["run", "dev"], { stdio: "inherit", shell: true });
    const ready = await waitForServer();
    if (!ready) {
      await stopProcessTree(devProcess.pid);
      throw new Error(`Dev server did not become ready on ${BASE_URL}`);
    }
  }

  const exitCode = await runCommand("k6", ["run", "tests/load/k6/capture-analyze.js"], {
    env: { ...process.env, BASE_URL },
  });

  if (devProcess) {
    await stopProcessTree(devProcess.pid);
  }

  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
