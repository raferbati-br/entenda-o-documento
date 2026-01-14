const KEY = "eod_session_token_v1";

export async function getSessionToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(KEY);
}

export async function ensureSessionToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const existing = sessionStorage.getItem(KEY);
  if (existing) return existing;

  const res = await fetch("/api/session-token");
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok || typeof data?.token !== "string") return null;
  sessionStorage.setItem(KEY, data.token);
  return data.token;
}
