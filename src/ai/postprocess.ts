/**
 * Módulo para pós-processamento dos resultados da análise de documentos.
 * Suaviza linguagem prescritiva, redige dados sensíveis e estrutura em cards.
 */

import type { AnalyzeResult, Card, CardId, Prompt } from "./types";
import { redactSensitiveData, safeShorten } from "../lib/text";
import { isRecord } from "../lib/typeGuards";
import { POSTPROCESS_TEXTS } from "../lib/constants";

// Limita valor entre 0 e 1
function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

// Converte valor para string, com fallback
function asString(x: unknown): string {
  return typeof x === "string" ? x : "";
}

type SanitizerStats = {
  softened: boolean; // Indica se a linguagem foi suavizada
};

const SANITIZER_CONFIDENCE_PENALTY = 0.1; // Penalidade na confiança se suavizado

/**
 * Suaviza linguagem prescritiva para tom neutro, evitando conselhos diretos.
 */
function softenPrescriptiveLanguage(s: string): { text: string; softened: boolean } {
  if (!s) return { text: s, softened: false };
  const replacements = POSTPROCESS_TEXTS.SOFTEN_REPLACEMENTS;
  let out = s;
  let softened = false;
  for (const [rx, rep] of replacements) {
    const next = out.replace(rx, rep);
    if (next !== out) softened = true;
    out = next;
  }
  return { text: out, softened };
}

// Normaliza texto do card, aplicando sanitização e limites
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

// Constrói um card estruturado a partir dos dados brutos
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
  sanitizerApplied: boolean; // Se o sanitizer foi aplicado
  confidenceLow: boolean; // Se a confiança é baixa
};

// Pós-processa com estatísticas
export function postprocessWithStats(raw: unknown, prompt: Prompt): { result: AnalyzeResult; stats: PostprocessStats } {
  const rawRecord = isRecord(raw) ? raw : {};
  let confidence = clamp01(Number(rawRecord.confidence));
  const stats: SanitizerStats = { softened: false };

  // Organiza cards por ID
  const inputCards = Array.isArray(rawRecord.cards) ? rawRecord.cards : [];
  const byId: Record<string, RawCard> = {};
  for (const c of inputCards) {
    if (isRecord(c) && typeof c.id === "string") byId[c.id] = c as RawCard;
  }

  // Constrói lista de cards padrão
  const cards: Card[] = [
    buildCard("whatIs", POSTPROCESS_TEXTS.CARD_TITLES.whatIs, POSTPROCESS_TEXTS.CARD_FALLBACKS.whatIs, byId, stats),
    buildCard(
      "whatSays",
      POSTPROCESS_TEXTS.CARD_TITLES.whatSays,
      POSTPROCESS_TEXTS.CARD_FALLBACKS.whatSays,
      byId,
      stats
    ),
    buildCard(
      "dates",
      POSTPROCESS_TEXTS.CARD_TITLES.dates,
      POSTPROCESS_TEXTS.CARD_FALLBACKS.dates,
      byId,
      stats
    ),
    buildCard(
      "terms",
      POSTPROCESS_TEXTS.CARD_TITLES.terms,
      POSTPROCESS_TEXTS.CARD_FALLBACKS.terms,
      byId,
      stats
    ),
    buildCard(
      "whatUsuallyHappens",
      POSTPROCESS_TEXTS.CARD_TITLES.whatUsuallyHappens,
      POSTPROCESS_TEXTS.CARD_FALLBACKS.whatUsuallyHappens,
      byId,
      stats
    ),
  ];

  // Processa o aviso (notice)
  const rawNotice = asString(rawRecord.notice) || prompt.noticeDefault;
  const softenedNotice = softenPrescriptiveLanguage(rawNotice);
  if (softenedNotice.softened) stats.softened = true;
  let notice = safeShorten(redactSensitiveData(softenedNotice.text), 420);
  if (stats.softened) {
    confidence = clamp01(confidence - SANITIZER_CONFIDENCE_PENALTY);
  }
  const confidenceLow = confidence < 0.45;
  if (confidenceLow) {
    notice = POSTPROCESS_TEXTS.LOW_CONFIDENCE_NOTICE_PREFIX + notice;
  }

  return {
    result: { confidence, cards, notice },
    stats: { sanitizerApplied: stats.softened, confidenceLow },
  };
}

// Pós-processa sem estatísticas (versão simplificada)
export function postprocess(raw: unknown, prompt: Prompt): AnalyzeResult {
  return postprocessWithStats(raw, prompt).result;
}

