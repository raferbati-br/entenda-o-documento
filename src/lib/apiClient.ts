import { clearSessionToken, ensureSessionToken } from "@/lib/sessionToken";

type JsonResult<T> = {
  res: Response;
  data: T;
};

type JsonRequestOptions = {
  headers?: HeadersInit;
  signal?: AbortSignal | null;
};

export async function postJsonWithSession<T>(
  url: string,
  body: unknown,
  options?: JsonRequestOptions
): Promise<JsonResult<T>> {
  const token = await ensureSessionToken();
  const extraHeaders = options?.headers;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-session-token": token } : {}),
      ...extraHeaders,
    },
    body: JSON.stringify(body),
    signal: options?.signal ?? undefined,
  });

  const data = (await res.json().catch(() => ({}))) as T;
  if (res.status === 401) {
    await clearSessionToken();
  }

  return { res, data };
}

export async function postJsonWithSessionResponse(
  url: string,
  body: unknown,
  options?: JsonRequestOptions
): Promise<Response> {
  const token = await ensureSessionToken();
  const extraHeaders = options?.headers;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-session-token": token } : {}),
      ...extraHeaders,
    },
    body: JSON.stringify(body),
    signal: options?.signal ?? undefined,
  });

  if (res.status === 401) {
    await clearSessionToken();
  }

  return res;
}
