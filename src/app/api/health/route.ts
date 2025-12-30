import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "entenda-o-documento",
    ts: new Date().toISOString(),
  });
}