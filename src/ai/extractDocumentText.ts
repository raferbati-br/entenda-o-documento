import { getOcrPrompt } from "./prompts";
import { getProvider } from "./providers";

function safeShorten(s: string, max = 3000) {
  const t = (s || "").trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return t.slice(0, max - 3).trimEnd() + "...";
}

function redactSensitiveData(s: string): string {
  if (!s) return s;

  const patterns: RegExp[] = [
    /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, // CPF
    /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, // CNPJ
    /\b\d{5}\.?\d{5}\s?\d{5}\.?\d{6}\s?\d{5}\.?\d{6}\s?\d{1,2}\b/g, // linha digitavel (boleto)
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // email
    /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/g, // telefone
  ];

  let out = s;
  for (const rx of patterns) out = out.replace(rx, "***");
  return out;
}

export async function extractDocumentText(imageDataUrl: string): Promise<{
  documentText: string;
  meta: { provider: string; model: string };
  promptId: string;
}> {
  const promptId = process.env.OCR_PROMPT_ID ?? "entendaDocumento.ocr.v1";
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";

  const prompt = getOcrPrompt(promptId);
  const provider = getProvider();

  const { raw, meta } = await provider.analyze({ model, prompt, imageDataUrl });

  const text = typeof (raw as any)?.documentText === "string" ? (raw as any).documentText : "";
  const sanitized = safeShorten(redactSensitiveData(text), 3000);

  return { documentText: sanitized, meta, promptId: prompt.id };
}
