/**
 * Utilitários para manipulação de texto.
 * Inclui encurtamento seguro e redação de dados sensíveis.
 */

// Encurta texto com reticências se exceder limite
export function safeShorten(input: string, max: number): string {
  const t = (input || "").trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return t.slice(0, max - 3).trimEnd() + "...";
}

// Padrões para redação de dados sensíveis
const REDACTION_PATTERNS: RegExp[] = [
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, // CPF
  /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, // CNPJ
  /\b\d{5}\.?\d{5}\s?\d{5}\.?\d{6}\s?\d{5}\.?\d{6}\s?\d{1,2}\b/g, // linha digitável (boleto)
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // email
  /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/g, // telefone
];

// Redige dados sensíveis no texto
export function redactSensitiveData(input: string): string {
  if (!input) return input;

  let out = input;
  for (const rx of REDACTION_PATTERNS) out = out.replace(rx, "***");
  return out;
}
