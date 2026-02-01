/**
 * Cliente para fazer requisições HTTP à API, com suporte a tokens de sessão.
 * Gerencia autenticação automática e limpeza de sessão em caso de erro 401.
 */

import { clearSessionToken, ensureSessionToken } from "@/lib/sessionToken";

type JsonResult<T> = {
  res: Response; // Resposta HTTP
  data: T; // Dados JSON parseados
};

type JsonRequestOptions = {
  headers?: HeadersInit; // Headers adicionais
  signal?: AbortSignal | null; // Para cancelar requisição
};

// Faz requisição POST com JSON e sessão, retornando resposta e dados
export async function postJsonWithSession<T>(
  url: string,
  body: unknown,
  options?: JsonRequestOptions
): Promise<JsonResult<T>> {
  const token = await ensureSessionToken(); // Garante token válido
  const extraHeaders = options?.headers;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-session-token": token } : {}), // Adiciona token se disponível
      ...extraHeaders,
    },
    body: JSON.stringify(body),
    signal: options?.signal ?? undefined,
  });

  const data = (await res.json().catch(() => ({}))) as T; // Parseia JSON com fallback
  if (res.status === 401) {
    await clearSessionToken(); // Limpa token em erro de autenticação
  }

  return { res, data };
}

// Faz requisição POST com JSON e sessão, retornando apenas a resposta
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
