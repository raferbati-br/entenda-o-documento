import type { AnalyzeResult, Card, CardId, Prompt } from "./types";
import { redactSensitiveData, safeShorten } from "../lib/text";
import { isRecord } from "../lib/typeGuards";

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function asString(x: unknown): string {
  return typeof x === "string" ? x : "";
}

type SanitizerStats = {
  softened: boolean;
};

const SANITIZER_CONFIDENCE_PENALTY = 0.1;

/**
 * Este é um "mini-sanitizer" leve que você já tinha no route.ts.
 * (O épico do sanitizer completo pode vir depois.)
 */
function softenPrescriptiveLanguage(s: string): { text: string; softened: boolean } {
  if (!s) return { text: s, softened: false };
  const replacements: Array<[RegExp, string]> = [
    [/\bvocê deve\b/gi, "o documento indica que"],
    [/\bvocê tem que\b/gi, "o documento menciona que"],
    [/\btem que\b/gi, "o documento menciona que"],
    [/\bobrigatório\b/gi, "mencionado como necessário"],
    [/\bprocure imediatamente\b/gi, "pode ser útil buscar orientação adequada"],
  ];
  let out = s;
  let softened = false;
  for (const [rx, rep] of replacements) {
    const next = out.replace(rx, rep);
    if (next !== out) softened = true;
    out = next;
  }
  return { text: out, softened };
}

function normalizeCardText(value: unknown, fallback: string, stats: SanitizerStats, max = 500) {
  const softened = softenPrescriptiveLanguage(asString(value));
  if (softened.softened) stats.softened = true;
  const cleaned = redactSensitiveData(softened.text);
  const text = safeShorten(cleaned, max);
  return text || fallback;
}

type RawCard = {
  title?: unknown;
  text?: unknown;
};

function buildCard(
  id: CardId,
  titleFallback: string,
  textFallback: string,
  byId: Record<string, RawCard>,
  stats: SanitizerStats
): Card {
  return {
    id,
    title: asString(byId[id]?.title) || titleFallback,
    text: normalizeCardText(byId[id]?.text, textFallback, stats),
  };
}

export type PostprocessStats = {
  sanitizerApplied: boolean;
  confidenceLow: boolean;
};

export function postprocessWithStats(raw: unknown, prompt: Prompt): { result: AnalyzeResult; stats: PostprocessStats } {
  const rawRecord = isRecord(raw) ? raw : {};
  let confidence = clamp01(Number(rawRecord.confidence));
  const stats: SanitizerStats = { softened: false };

  const inputCards = Array.isArray(rawRecord.cards) ? rawRecord.cards : [];
  const byId: Record<string, RawCard> = {};
  for (const c of inputCards) {
    if (isRecord(c) && typeof c.id === "string") byId[c.id] = c as RawCard;
  }

  const cards: Card[] = [
    buildCard("whatIs", "O que é este documento", "Não foi possível confirmar pelo documento.", byId, stats),
    buildCard(
      "whatSays",
      "O que este documento está comunicando",
      "Não foi possível confirmar pelo documento.",
      byId,
      stats
    ),
    buildCard(
      "dates",
      "Datas ou prazos importantes",
      "Não foi possível confirmar datas ou prazos no documento.",
      byId,
      stats
    ),
    buildCard(
      "terms",
      "📘 Palavras difíceis explicadas",
      "Não há termos difíceis relevantes neste documento.",
      byId,
      stats
    ),
    buildCard(
      "whatUsuallyHappens",
      "O que normalmente acontece",
      "Não foi possível confirmar pelo documento.",
      byId,
      stats
    ),
  ];

  const rawNotice = asString(rawRecord.notice) || prompt.noticeDefault;
  const softenedNotice = softenPrescriptiveLanguage(rawNotice);
  if (softenedNotice.softened) stats.softened = true;
  let notice = safeShorten(redactSensitiveData(softenedNotice.text), 420);
  if (stats.softened) {
    confidence = clamp01(confidence - SANITIZER_CONFIDENCE_PENALTY);
  }
  const confidenceLow = confidence < 0.45;
  if (confidenceLow) {
    notice = "A imagem parece estar pouco legível, então a explicação pode estar incompleta. " + notice;
  }

  return {
    result: { confidence, cards, notice },
    stats: { sanitizerApplied: stats.softened, confidenceLow },
  };
}

export function postprocess(raw: unknown, prompt: Prompt): AnalyzeResult {
  return postprocessWithStats(raw, prompt).result;
}

