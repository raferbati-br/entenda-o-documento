import type { AnalyzeResult, Card, CardId, Prompt } from "./types";

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function safeShorten(s: string, max = 500) {
  const t = (s || "").trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

function asString(x: unknown): string {
  return typeof x === "string" ? x : "";
}

/**
 * Este é um "mini-sanitizer" leve que você já tinha no route.ts.
 * (O épico do sanitizer completo pode vir depois.)
 */
function softenPrescriptiveLanguage(s: string): string {
  if (!s) return s;
  const replacements: Array<[RegExp, string]> = [
    [/\bvocê deve\b/gi, "o documento indica que"],
    [/\bvocê tem que\b/gi, "o documento menciona que"],
    [/\btem que\b/gi, "o documento menciona que"],
    [/\bobrigatório\b/gi, "mencionado como necessário"],
    [/\bprocure imediatamente\b/gi, "pode ser útil buscar orientação adequada"],
  ];
  let out = s;
  for (const [rx, rep] of replacements) out = out.replace(rx, rep);
  return out;
}

function normalizeCardText(value: unknown, fallback: string, max = 500) {
  const text = safeShorten(softenPrescriptiveLanguage(asString(value)), max);
  return text || fallback;
}

function buildCard(
  id: CardId,
  titleFallback: string,
  textFallback: string,
  byId: Record<string, any>
): Card {
  return {
    id,
    title: asString(byId[id]?.title) || titleFallback,
    text: normalizeCardText(byId[id]?.text, textFallback),
  };
}

export function postprocess(raw: any, prompt: Prompt): AnalyzeResult {
  const confidence = clamp01(Number(raw?.confidence));

  const inputCards = Array.isArray(raw?.cards) ? raw.cards : [];
  const byId: Record<string, any> = {};
  for (const c of inputCards) {
    if (c && typeof c.id === "string") byId[c.id] = c;
  }

  const cards: Card[] = [
    buildCard("whatIs", "O que é este documento", "Não foi possível confirmar pelo documento.", byId),
    buildCard(
      "whatSays",
      "O que este documento está comunicando",
      "Não foi possível confirmar pelo documento.",
      byId
    ),
    buildCard(
      "dates",
      "Datas ou prazos importantes",
      "Não foi possível confirmar datas ou prazos no documento.",
      byId
    ),
    buildCard(
      "terms",
      "📘 Palavras difíceis explicadas",
      "Não há termos difíceis relevantes neste documento.",
      byId
    ),
    buildCard(
      "whatUsuallyHappens",
      "O que normalmente acontece",
      "Não foi possível confirmar pelo documento.",
      byId
    ),
  ];

  let notice = safeShorten(asString(raw?.notice) || prompt.noticeDefault, 420);
  if (confidence < 0.45) {
    notice = "A imagem parece estar pouco legível, então a explicação pode estar incompleta. " + notice;
  }

  return { confidence, cards, notice };
}
