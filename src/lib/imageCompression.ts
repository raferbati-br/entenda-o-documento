// src/lib/imageCompression.ts
export type CompressOptions = {
  maxDimension?: number; // maior lado em px
  quality?: number; // 0..1
  mimeType?: "image/jpeg" | "image/webp";
};

const DEFAULTS: Required<CompressOptions> = {
  maxDimension: 1600,
  quality: 0.78,
  mimeType: "image/jpeg",
};

export async function compressBlobToDataUrl(
  blob: Blob,
  opts: CompressOptions = {}
): Promise<{ dataUrl: string; bytes: number; width: number; height: number }> {
  const o = { ...DEFAULTS, ...opts };

  const bitmap = await decodeImage(blob);

  const { w, h } = fitInside(bitmap.width, bitmap.height, o.maxDimension);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D indisponível.");

  // fundo branco (evita preto/transparência em JPEG)
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(bitmap, 0, 0, w, h);

  const dataUrl = canvas.toDataURL(o.mimeType, o.quality);
  const bytes = estimateDataUrlBytes(dataUrl);

  if ("close" in bitmap) {
    bitmap.close();
  }

  return { dataUrl, bytes, width: w, height: h };
}

function fitInside(srcW: number, srcH: number, maxDim: number) {
  const longSide = Math.max(srcW, srcH);
  if (longSide <= maxDim) return { w: srcW, h: srcH };
  const scale = maxDim / longSide;
  return { w: Math.max(1, Math.round(srcW * scale)), h: Math.max(1, Math.round(srcH * scale)) };
}

async function decodeImage(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  // Tenta respeitar orientação EXIF quando suportado
  if ("createImageBitmap" in window) {
    try {
      const options = { imageOrientation: "from-image" } as ImageBitmapOptions;
      return await createImageBitmap(blob, options);
    } catch {
      // fallback abaixo
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImg(url);
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem."));
    img.src = src;
  });
}

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}
