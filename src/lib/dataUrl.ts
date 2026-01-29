export type ParsedDataUrl = {
  mimeType: string;
  base64: string;
};

type ParseOptions = {
  requireImage?: boolean;
};

export function parseDataUrl(value: string, options: ParseOptions = {}): ParsedDataUrl | null {
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  if (options.requireImage && !mimeType.startsWith("image/")) return null;
  return { mimeType, base64: match[2] };
}
