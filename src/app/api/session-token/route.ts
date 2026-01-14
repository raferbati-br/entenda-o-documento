import { NextResponse } from "next/server";
import { createSessionToken, isOriginAllowed } from "@/lib/requestAuth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isOriginAllowed(req)) {
    return NextResponse.json({ ok: false, error: "Origem não permitida" }, { status: 403 });
  }

  try {
    const token = createSessionToken();
    return NextResponse.json({ ok: true, token }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    if (String(err?.message || "") === "API_TOKEN_SECRET_NOT_SET") {
      return NextResponse.json({ ok: false, error: "API_TOKEN_SECRET não configurada" }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: "Erro ao gerar token" }, { status: 500 });
  }
}
