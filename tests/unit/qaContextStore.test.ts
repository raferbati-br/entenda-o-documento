import { describe, expect, it } from "vitest";
import { clearQaContext, loadQaContext, saveQaContext } from "@/lib/qaContextStore";


describe("qaContextStore", () => {
  it("stores and clears qa context", () => {
    expect(loadQaContext()).toBeNull();
    saveQaContext("ctx");
    expect(loadQaContext()).toBe("ctx");
    clearQaContext();
    expect(loadQaContext()).toBeNull();
  });
});
