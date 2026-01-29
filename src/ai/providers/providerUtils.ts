export type ModelParseError = Error & { raw?: string };

export function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

export function parseModelJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const extracted = extractFirstJsonObject(text);
    if (!extracted) {
      const err: ModelParseError = new Error("MODEL_NO_JSON");
      err.raw = text;
      throw err;
    }
    try {
      return JSON.parse(extracted);
    } catch {
      const err: ModelParseError = new Error("MODEL_INVALID_JSON");
      err.raw = text;
      throw err;
    }
  }
}
