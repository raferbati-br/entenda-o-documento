/** @jest-environment node */
import { clearSessionToken, ensureSessionToken, getSessionToken } from "@/lib/sessionToken";

describe("sessionToken (no window)", () => {
  it("returns null when window is not available", async () => {
    await expect(getSessionToken()).resolves.toBeNull();
    await expect(ensureSessionToken()).resolves.toBeNull();
    await expect(clearSessionToken()).resolves.toBeUndefined();
  });
});
