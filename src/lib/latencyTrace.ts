import { isRecord } from "./typeGuards";

type LatencyTrace = {
  startMs?: number;
  steps: Record<string, number>;
  marks: Record<string, number>;
};

const KEY = "eod_latency_trace_v1";

function isBrowser() {
  return typeof globalThis.window !== "undefined" && typeof globalThis.sessionStorage !== "undefined";
}

function toNumberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  const out: Record<string, number> = {};
  for (const [key, v] of Object.entries(value)) {
    if (typeof v === "number" && Number.isFinite(v)) {
      out[key] = v;
    }
  }
  return out;
}

function normalizeTrace(value: unknown): LatencyTrace {
  const record = isRecord(value) ? value : {};
  const steps = toNumberRecord(record.steps);
  const marks = toNumberRecord(record.marks);
  const startMs = typeof record.startMs === "number" ? record.startMs : undefined;
  return { startMs, steps, marks };
}

function loadTrace(): LatencyTrace {
  if (!isBrowser()) return { steps: {}, marks: {} };
  const raw = globalThis.sessionStorage.getItem(KEY);
  if (!raw) return { steps: {}, marks: {} };
  try {
    return normalizeTrace(JSON.parse(raw));
  } catch {
    return { steps: {}, marks: {} };
  }
}

function saveTrace(trace: LatencyTrace) {
  if (!isBrowser()) return;
  globalThis.sessionStorage.setItem(KEY, JSON.stringify(trace));
}

export function startLatencyTrace() {
  saveTrace({ startMs: Date.now(), steps: {}, marks: {} });
}

export function markLatencyTrace(name: string) {
  if (!name || !isBrowser()) return;
  const trace = loadTrace();
  trace.marks[name] = Date.now();
  saveTrace(trace);
}

export function recordLatencyStep(name: string, ms: number) {
  if (!name || !Number.isFinite(ms) || !isBrowser()) return;
  const trace = loadTrace();
  trace.steps[name] = Math.max(0, Math.round(ms));
  saveTrace(trace);
}

export function getLatencyTraceSnapshot(nowMs = Date.now()) {
  if (!isBrowser()) return null;
  const trace = loadTrace();
  if (!Number.isFinite(trace.startMs)) return null;
  return {
    startMs: trace.startMs as number,
    totalMs: Math.max(0, Math.round(nowMs - (trace.startMs as number))),
    steps: trace.steps,
    marks: trace.marks,
  };
}

export function clearLatencyTrace() {
  if (!isBrowser()) return;
  globalThis.sessionStorage.removeItem(KEY);
}
