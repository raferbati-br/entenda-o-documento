export type ParsedDataUrl = {
  mimeType: string;
  base64: string;
};

type ParseOptions = {
  requireImage?: boolean;
};

const DATA_URL_REGEX = /^data:([^;]+);base64,(.+)$/;

export function parseDataUrl(value: string, options: ParseOptions = {}): ParsedDataUrl | null {
  const match = DATA_URL_REGEX.exec(value);
  if (!match) return null;
  const mimeType = match[1];
  if (options.requireImage && !mimeType.startsWith("image/")) return null;
  return { mimeType, base64: match[2] };
}
