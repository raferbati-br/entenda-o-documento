/**
 * Utilitários de autenticação para requisições.
 * Cria e verifica tokens de sessão, valida origens permitidas.
 */

import crypto from "node:crypto";

const TOKEN_TTL_SECONDS = 5 * 60; // 5 minutos

// Codifica em base64url
function base64UrlEncode(input: string) {
  return Buffer.from(input).toString("base64url");
}

// Decodifica de base64url
function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

// Assina payload com HMAC
function sign(payloadB64: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

// Cria token de sessão JWT-like
export function createSessionToken() {
  const secret = process.env.API_TOKEN_SECRET;
  if (!secret) throw new Error("API_TOKEN_SECRET_NOT_SET");

  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = base64UrlEncode(JSON.stringify({ exp }));
  const sig = sign(payload, secret);
  return `${payload}.${sig}`;
}

// Verifica token de sessão
export function verifySessionToken(token: string) {
  const secret = process.env.API_TOKEN_SECRET;
  if (!secret) return false;

  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;

  const expected = sign(payload, secret);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;

  try {
    const parsed = JSON.parse(base64UrlDecode(payload));
    const exp = Number(parsed?.exp || 0);
    if (!Number.isFinite(exp)) return false;
    return exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

// Verifica se origem é permitida
export function isOriginAllowed(req: Request) {
  const allowed = process.env.APP_ORIGIN;
  if (!allowed) {
    // Em desenvolvimento, permite localhost
    const origin = req.headers.get("origin") || "";
    return origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1");
  }

  const origin = req.headers.get("origin");
  if (origin && origin === allowed) return true;

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      return refOrigin === allowed;
    } catch {
      return false;
    }
  }

  return false;
}
