/**
 * Gerenciamento de token de sessão no sessionStorage.
 * Obtém, limpa e garante token válido via API.
 */

const KEY = "eod_session_token_v1";

// Obtém token salvo
export async function getSessionToken(): Promise<string | null> {
  if (globalThis.window === undefined) return null;
  return globalThis.sessionStorage.getItem(KEY);
}

// Limpa token
export async function clearSessionToken(): Promise<void> {
  if (globalThis.window === undefined) return;
  globalThis.sessionStorage.removeItem(KEY);
}

// Garante token válido, obtendo novo se necessário
export async function ensureSessionToken(): Promise<string | null> {
  if (globalThis.window === undefined) return null;
  const existing = globalThis.sessionStorage.getItem(KEY);
  if (existing) return existing;

  // Obtém novo token da API
  const res = await fetch("/api/session-token");
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok || typeof data?.token !== "string") return null;
  globalThis.sessionStorage.setItem(KEY, data.token);
  return data.token;
}
