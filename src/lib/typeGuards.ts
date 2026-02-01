/**
 * Guards de tipo TypeScript para validação de tipos em runtime.
 */

// Verifica se valor é um record (objeto não-nulo)
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
