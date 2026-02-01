/**
 * Utilitários para manipulação de Data URLs (base64 encoded).
 * Permite parsear e validar URLs de dados, especialmente imagens.
 */

export type ParsedDataUrl = {
  mimeType: string; // Tipo MIME (ex: image/png)
  base64: string; // Conteúdo base64
};

type ParseOptions = {
  requireImage?: boolean; // Se deve exigir que seja imagem
};

const DATA_URL_REGEX = /^data:([^;]+);base64,(.+)$/; // Regex para data URLs

// Parseia uma data URL em mimeType e base64
export function parseDataUrl(value: string, options: ParseOptions = {}): ParsedDataUrl | null {
  const match = DATA_URL_REGEX.exec(value);
  if (!match) return null;
  const mimeType = match[1];
  if (options.requireImage && !mimeType.startsWith("image/")) return null;
  return { mimeType, base64: match[2] };
}
