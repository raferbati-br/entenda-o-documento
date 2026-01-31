import { describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

import { GET } from "@/app/api/health/route";

describe("api/health", () => {
  it("returns ok payload", async () => {
    const res = await GET();
    expect(res.body).toMatchObject({ ok: true, service: "entenda-o-documento" });
    expect(res.status).toBe(200);
  });
});
