/**
 * Armazenamento de captura de imagem usando IndexedDB com fallback em memória.
 * Persiste blobs de imagem entre sessões, com suporte a falhas no IndexedDB.
 */

import { del, get, set } from "idb-keyval";

const KEY = "eod_capture_v1"; // Chave para armazenar a captura

export type CapturePayload = {
  blob: Blob; // Blob da imagem capturada
  createdAt: string; // Timestamp de criação
};

// Fallback em memória para sobreviver navegação entre páginas
let memory: CapturePayload | null = null;

// Salva a captura no IndexedDB e memória
export async function saveCapture(payload: CapturePayload) {
  memory = payload;
  try {
    await set(KEY, payload);
  } catch {
    // Se IndexedDB falhar, memória garante o fluxo
  }
}

// Carrega a captura do IndexedDB ou memória
export async function loadCapture(): Promise<CapturePayload | null> {
  if (memory?.blob) return memory;

  try {
    const v = await get<CapturePayload>(KEY);
    if (v?.blob) {
      memory = v;
      return v;
    }
  } catch {
    // Ignora erros
  }
  return null;
}

// Limpa a captura do IndexedDB e memória
export async function clearCapture() {
  memory = null;
  try {
    await del(KEY);
  } catch {
    // Ignora erros
  }
}