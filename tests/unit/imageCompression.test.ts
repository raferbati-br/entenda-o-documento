/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { compressBlobToDataUrl } from "@/lib/imageCompression";


describe("imageCompression", () => {
  const realCreateImageBitmap = globalThis.createImageBitmap;
  const realCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.createImageBitmap = realCreateImageBitmap;
    document.createElement = realCreateElement;
  });

  it("compresses using createImageBitmap and scales", async () => {
    const closeMock = vi.fn();
    globalThis.createImageBitmap = vi.fn().mockResolvedValue({
      width: 2000,
      height: 1000,
      close: closeMock,
    } as ImageBitmap);

    const ctx = {
      fillStyle: "",
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      imageSmoothingEnabled: false,
      imageSmoothingQuality: "low",
    } as unknown as CanvasRenderingContext2D;

    document.createElement = vi.fn().mockReturnValue({
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(ctx),
      toDataURL: vi.fn().mockReturnValue("data:image/jpeg;base64,AAAA"),
    });

    const blob = new Blob(["x"], { type: "image/jpeg" });
    const result = await compressBlobToDataUrl(blob, { maxDimension: 1600, quality: 0.7 });

    expect(result.width).toBe(1600);
    expect(result.height).toBe(800);
    expect(result.bytes).toBe(3);
    expect(result.dataUrl).toContain("data:image/jpeg;base64,AAAA");
    expect(closeMock).toHaveBeenCalled();
  });

  it("throws when canvas context is missing", async () => {
    globalThis.createImageBitmap = vi.fn().mockResolvedValue({
      width: 100,
      height: 100,
    } as ImageBitmap);

    document.createElement = vi.fn().mockReturnValue({
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(null),
      toDataURL: vi.fn(),
    });

    const blob = new Blob(["x"], { type: "image/jpeg" });
    await expect(compressBlobToDataUrl(blob)).rejects.toThrow("Canvas 2D indisponível.");
  });
});
