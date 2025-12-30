import { del, get, set } from "idb-keyval";

const KEY = "eod_capture_v1";

export type CapturePayload = {
  blob: Blob;
  createdAt: string;
};

// ✅ fallback em memória (sobrevive navegação entre páginas na mesma aba)
let memory: CapturePayload | null = null;

export async function saveCapture(payload: CapturePayload) {
  memory = payload;
  try {
    await set(KEY, payload);
  } catch {
    // se o IndexedDB falhar, tudo bem — memória segura o fluxo
  }
}

export async function loadCapture(): Promise<CapturePayload | null> {
  if (memory?.blob) return memory;

  try {
    const v = await get<CapturePayload>(KEY);
    if (v?.blob) {
      memory = v;
      return v;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function clearCapture() {
  memory = null;
  try {
    await del(KEY);
  } catch {
    // ignore
  }
}