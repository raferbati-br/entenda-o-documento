import { parseDataUrl } from "@/lib/dataUrl";


describe("parseDataUrl", () => {
  it("returns null for invalid data url", () => {
    expect(parseDataUrl("not-a-data-url")).toBeNull();
  });

  it("parses valid data url", () => {
    const result = parseDataUrl("data:image/png;base64,abc123");
    expect(result).toEqual({ mimeType: "image/png", base64: "abc123" });
  });

  it("rejects non-image when requireImage is true", () => {
    const result = parseDataUrl("data:text/plain;base64,xyz", { requireImage: true });
    expect(result).toBeNull();
  });
});
