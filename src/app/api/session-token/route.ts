import { NextResponse } from "next/server";
import { createSessionToken } from "@/lib/requestAuth";
import { badRequest, createRouteContext, handleTokenSecretError, runCommonGuards } from "@/lib/apiRouteUtils";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const ctx = createRouteContext(req);

  const guardError = await runCommonGuards(req, ctx, { requireSession: false });
  if (guardError) return guardError;

  try {
    const token = createSessionToken();
    return NextResponse.json({ ok: true, token }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message : "";

    const secretError = handleTokenSecretError(code);
    if (secretError) return secretError;

    return badRequest("Erro ao gerar token", 500);
  }
}
