/** @jest-environment jsdom */
import { compressBlobToDataUrl } from "@/lib/imageCompression";


describe("imageCompression", () => {
  const realCreateImageBitmap = globalThis.createImageBitmap;
  const realCreateElement = document.createElement.bind(document);
  const realWindowCreateImageBitmap = globalThis.window?.createImageBitmap;

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.createImageBitmap = realCreateImageBitmap;
    document.createElement = realCreateElement;
    if (globalThis.window) {
      globalThis.window.createImageBitmap = realWindowCreateImageBitmap;
    }
  });

  it("compresses using createImageBitmap and scales", async () => {
    const closeMock = jest.fn();
    globalThis.createImageBitmap = jest.fn().mockResolvedValue({
      width: 2000,
      height: 1000,
      close: closeMock,
    } as ImageBitmap);
    if (globalThis.window) {
      globalThis.window.createImageBitmap = globalThis.createImageBitmap as typeof globalThis.window.createImageBitmap;
    }

    const ctx = {
      fillStyle: "",
      fillRect: jest.fn(),
      drawImage: jest.fn(),
      imageSmoothingEnabled: false,
      imageSmoothingQuality: "low",
    } as unknown as CanvasRenderingContext2D;

    document.createElement = jest.fn().mockReturnValue({
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue(ctx),
      toDataURL: jest.fn().mockReturnValue("data:image/jpeg;base64,AAAA"),
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
    globalThis.createImageBitmap = jest.fn().mockResolvedValue({
      width: 100,
      height: 100,
    } as ImageBitmap);

    document.createElement = jest.fn().mockReturnValue({
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue(null),
      toDataURL: jest.fn(),
    });

    const blob = new Blob(["x"], { type: "image/jpeg" });
    await expect(compressBlobToDataUrl(blob)).rejects.toThrow("Canvas 2D indisponível.");
  });

  it("falls back to Image when createImageBitmap fails", async () => {
    const createObjectUrlSpy = jest.fn(() => "blob:mock");
    const revokeObjectUrlSpy = jest.fn();
    URL.createObjectURL = createObjectUrlSpy;
    URL.revokeObjectURL = revokeObjectUrlSpy;

    globalThis.createImageBitmap = jest.fn().mockRejectedValue(new Error("nope"));
    if (globalThis.window) {
      globalThis.window.createImageBitmap = globalThis.createImageBitmap as typeof globalThis.window.createImageBitmap;
    }

    class MockImage {
      width = 1200;
      height = 600;
      onload?: () => void;
      onerror?: () => void;
      set src(_value: string) {
        this.onload?.();
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).Image = MockImage;

    const ctx = {
      fillStyle: "",
      fillRect: jest.fn(),
      drawImage: jest.fn(),
      imageSmoothingEnabled: false,
      imageSmoothingQuality: "low",
    } as unknown as CanvasRenderingContext2D;

    document.createElement = jest.fn().mockReturnValue({
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue(ctx),
      toDataURL: jest.fn().mockReturnValue("data:image/jpeg;base64,AA=="),
    });

    const blob = new Blob(["x"], { type: "image/jpeg" });
    const result = await compressBlobToDataUrl(blob, { maxDimension: 1600 });
    expect(result.bytes).toBe(1);
    expect(createObjectUrlSpy).toHaveBeenCalled();
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:mock");
  });

  it("calculates base64 padding bytes", async () => {
    globalThis.createImageBitmap = jest.fn().mockResolvedValue({
      width: 10,
      height: 10,
    } as ImageBitmap);
    if (globalThis.window) {
      globalThis.window.createImageBitmap = globalThis.createImageBitmap as typeof globalThis.window.createImageBitmap;
    }

    const ctx = {
      fillStyle: "",
      fillRect: jest.fn(),
      drawImage: jest.fn(),
      imageSmoothingEnabled: false,
      imageSmoothingQuality: "low",
    } as unknown as CanvasRenderingContext2D;

    const toDataURL = jest.fn()
      .mockReturnValueOnce("data:image/jpeg;base64,AA==")
      .mockReturnValueOnce("data:image/jpeg;base64,AAA=");

    document.createElement = jest.fn().mockReturnValue({
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue(ctx),
      toDataURL,
    });

    const blob = new Blob(["x"], { type: "image/jpeg" });
    const first = await compressBlobToDataUrl(blob);
    const second = await compressBlobToDataUrl(blob);

    expect(first.bytes).toBe(1);
    expect(second.bytes).toBe(2);
  });

  it("keeps dimensions when image is already within max size", async () => {
    globalThis.createImageBitmap = jest.fn().mockResolvedValue({
      width: 800,
      height: 600,
    } as ImageBitmap);
    if (globalThis.window) {
      globalThis.window.createImageBitmap = globalThis.createImageBitmap as typeof globalThis.window.createImageBitmap;
    }

    const ctx = {
      fillStyle: "",
      fillRect: jest.fn(),
      drawImage: jest.fn(),
      imageSmoothingEnabled: false,
      imageSmoothingQuality: "low",
    } as unknown as CanvasRenderingContext2D;

    document.createElement = jest.fn().mockReturnValue({
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue(ctx),
      toDataURL: jest.fn().mockReturnValue("data:image/jpeg;base64,AAAA"),
    });

    const blob = new Blob(["x"], { type: "image/jpeg" });
    const result = await compressBlobToDataUrl(blob, { maxDimension: 1600 });

    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it("uses fallback path when window is undefined", async () => {
    const originalWindow = globalThis.window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window = undefined;
    URL.createObjectURL = jest.fn(() => "blob:mock");
    URL.revokeObjectURL = jest.fn();

    class MockImage {
      width = 100;
      height = 100;
      onload?: () => void;
      onerror?: () => void;
      set src(_value: string) {
        this.onload?.();
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).Image = MockImage;

    const ctx = {
      fillStyle: "",
      fillRect: jest.fn(),
      drawImage: jest.fn(),
      imageSmoothingEnabled: false,
      imageSmoothingQuality: "low",
    } as unknown as CanvasRenderingContext2D;

    document.createElement = jest.fn().mockReturnValue({
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue(ctx),
      toDataURL: jest.fn().mockReturnValue("data:image/jpeg;base64,AAAA"),
    });

    const blob = new Blob(["x"], { type: "image/jpeg" });
    const result = await compressBlobToDataUrl(blob);
    expect(result.bytes).toBe(3);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window = originalWindow;
  });

  it("rejects when image fails to load in fallback", async () => {
    if (globalThis.window) {
      delete (globalThis.window as { createImageBitmap?: unknown }).createImageBitmap;
    }
    globalThis.createImageBitmap = undefined;
    URL.createObjectURL = jest.fn(() => "blob:bad");
    URL.revokeObjectURL = jest.fn();

    class ErrorImage {
      onload?: () => void;
      onerror?: () => void;
      set src(_value: string) {
        this.onerror?.();
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).Image = ErrorImage;

    document.createElement = jest.fn().mockReturnValue({
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue({
        fillStyle: "",
        fillRect: jest.fn(),
        drawImage: jest.fn(),
        imageSmoothingEnabled: false,
        imageSmoothingQuality: "low",
      }),
      toDataURL: jest.fn().mockReturnValue("data:image/jpeg;base64,AAAA"),
    });

    const blob = new Blob(["x"], { type: "image/jpeg" });
    await expect(compressBlobToDataUrl(blob)).rejects.toThrow("Falha ao carregar imagem.");
  });
});
