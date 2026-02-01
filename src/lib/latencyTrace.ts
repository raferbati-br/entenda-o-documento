/**
 * Rastreamento de latência de operações usando sessionStorage.
 * Registra tempos de início, passos e marcas para análise de performance.
 */

import { isRecord } from "./typeGuards";

type LatencyTrace = {
  startMs?: number; // Timestamp de início
  steps: Record<string, number>; // Passos com duração em ms
  marks: Record<string, number>; // Marcas com timestamps
};

const KEY = "eod_latency_trace_v1";

// Verifica se está no navegador
function isBrowser() {
  return globalThis.window !== undefined && globalThis.sessionStorage !== undefined;
}

// Converte valor para record de números
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

// Normaliza trace de entrada
function normalizeTrace(value: unknown): LatencyTrace {
  const record = isRecord(value) ? value : {};
  const steps = toNumberRecord(record.steps);
  const marks = toNumberRecord(record.marks);
  const startMs = typeof record.startMs === "number" ? record.startMs : undefined;
  return { startMs, steps, marks };
}

// Carrega trace do sessionStorage
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

// Salva trace no sessionStorage
function saveTrace(trace: LatencyTrace) {
  if (!isBrowser()) return;
  globalThis.sessionStorage.setItem(KEY, JSON.stringify(trace));
}

// Inicia rastreamento
export function startLatencyTrace() {
  saveTrace({ startMs: Date.now(), steps: {}, marks: {} });
}

// Marca um ponto no tempo
export function markLatencyTrace(name: string) {
  if (!name || !isBrowser()) return;
  const trace = loadTrace();
  trace.marks[name] = Date.now();
  saveTrace(trace);
}

// Registra duração de um passo
export function recordLatencyStep(name: string, ms: number) {
  if (!name || !Number.isFinite(ms) || !isBrowser()) return;
  const trace = loadTrace();
  trace.steps[name] = Math.max(0, Math.round(ms));
  saveTrace(trace);
}

// Obtém snapshot do rastreamento
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

// Limpa rastreamento
export function clearLatencyTrace() {
  if (!isBrowser()) return;
  globalThis.sessionStorage.removeItem(KEY);
}
