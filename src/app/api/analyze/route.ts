import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===== Store (mesma do /api/capture) =====
type CaptureEntry = {
  imageBase64: string; // DataURL
  mimeType: string;
  createdAt: number;
  bytes: number;
};

const TTL_MS = 10 * 60 * 1000;

const g = globalThis as any;
g.__CAPTURE_STORE__ = g.__CAPTURE_STORE__ || new Map<string, CaptureEntry>();
const store: Map<string, CaptureEntry> = g.__CAPTURE_STORE__;

// ===== Helpers =====
function cleanupExpired() {
  const t = Date.now();
  for (const [id, entry] of store.entries()) {
    if (t - entry.createdAt > TTL_MS) store.delete(id);
  }
}

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

function asString(x: any): string {
  return typeof x === "string" ? x : "";
}

/**
 * Extrai o primeiro objeto JSON válido de um texto, se existir.
 */
function extractFirstJsonObject(text: string): string | null {
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

const NOTICE_DEFAULT =
  "Esta explicação é apenas informativa. Confira sempre as informações no documento original. Se restar dúvida, procure um órgão ou profissional adequado.";

// ===== Prompts (cards) =====
const SYSTEM_PROMPT = `Você é "Entenda o Documento".

Objetivo:
- Ajudar pessoas (especialmente idosas ou com baixa escolaridade) a compreender documentos burocráticos físicos.
- Explicar em português simples, com frases curtas, tom calmo e neutro.

Regras IMPORTANTES:
- Não dê aconselhamento jurídico, médico ou financeiro.
- Não diga o que a pessoa deve fazer. Evite linguagem prescritiva (ex.: "você deve", "faça", "pague", "tem que").
- Use apenas o que estiver visível/legível na imagem. Não invente dados.
- Se algo não estiver claro, escreva: "Não foi possível confirmar pelo documento."

Privacidade:
- Não reproduza dados sensíveis completos (CPF, RG, endereço, telefone, e-mail, códigos/linhas digitáveis, etc.).
- Se precisar mencionar, oculte com "***" ou "(dado ocultado)".

Formato de saída:
- Retorne APENAS um JSON válido (sem texto fora do JSON).
- Use exatamente este schema:

{
  "confidence": number,
  "cards": [
    { "id": "whatIs", "title": "O que é este documento", "text": string },
    { "id": "whatSays", "title": "O que este documento está comunicando", "text": string },
    { "id": "dates", "title": "Datas ou prazos importantes", "text": string },
    { "id": "terms", "title": "📘 Palavras difíceis explicadas", "text": string },
    { "id": "whatUsuallyHappens", "title": "O que normalmente acontece", "text": string }
  ],
  "notice": string
}

Regras:
- Cada "text" com no máximo ~500 caracteres.
- "confidence" entre 0 e 1 (0=ruim, 1=muito legível).`;

const USER_PROMPT = `Analise a imagem anexada de um documento físico (papel).

Preencha:
- whatIs: o que é o documento (tipo e objetivo)
- whatSays: o que ele está comunicando (resumo fiel)
- dates: datas/prazos que aparecem (se não houver, diga que não foi possível confirmar)
- terms: explique termos difíceis que realmente aparecem (se não houver, diga isso)
- whatUsuallyHappens: o que normalmente acontece em situações desse tipo (sem aconselhar)

Regras:
- Linguagem simples.
- Sem ordens.
- Sem aconselhamento.
- Não invente nomes/valores/datas.
- JSON válido apenas.`;

// ===== Route =====
export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY não configurada" },
        { status: 500 }
      );
    }

    cleanupExpired();

    const body: any = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });

    const captureId = typeof body.captureId === "string" ? body.captureId : "";
    const directImageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : "";

    let imageDataUrl = "";

    if (captureId) {
      const entry = store.get(captureId);
      if (entry?.imageBase64) {
        imageDataUrl = entry.imageBase64;

        // Recomendo liberar após uso (evita pico de memória)
        store.delete(captureId);
      }
    }

    if (!imageDataUrl && directImageBase64) {
      imageDataUrl = directImageBase64;
    }

    if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { ok: false, error: "Imagem não encontrada ou inválida (capture expirou)" },
        { status: 404 }
      );
    }

    // ✅ TS do seu SDK exige detail
    const resp = await openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          type: "message",
          role: "system",
          content: [{ type: "input_text", text: SYSTEM_PROMPT }],
        },
        {
          type: "message",
          role: "user",
          content: [
            { type: "input_text", text: USER_PROMPT },
            {
              type: "input_image",
              image_url: imageDataUrl,
              detail: "auto",
            },
          ],
        },
      ],
    });

    const text = resp.output_text ?? "";

    // Parse robusto
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const extracted = extractFirstJsonObject(text);
      if (!extracted) {
        return NextResponse.json(
          { ok: false, error: "Modelo não retornou JSON válido", raw: text },
          { status: 502 }
        );
      }
      try {
        parsed = JSON.parse(extracted);
      } catch {
        return NextResponse.json(
          { ok: false, error: "Modelo retornou JSON inválido", raw: text },
          { status: 502 }
        );
      }
    }

    // Normalização e garantias para o frontend (cards)
    const confidence = clamp01(Number(parsed?.confidence));

    const inputCards = Array.isArray(parsed?.cards) ? parsed.cards : [];

    const byId: Record<string, any> = {};
    for (const c of inputCards) {
      if (c && typeof c.id === "string") byId[c.id] = c;
    }

    const cards = [
      {
        id: "whatIs",
        title: asString(byId.whatIs?.title) || "O que é este documento",
        text: safeShorten(softenPrescriptiveLanguage(asString(byId.whatIs?.text))) || "Não foi possível confirmar pelo documento.",
      },
      {
        id: "whatSays",
        title: asString(byId.whatSays?.title) || "O que este documento está comunicando",
        text: safeShorten(softenPrescriptiveLanguage(asString(byId.whatSays?.text))) || "Não foi possível confirmar pelo documento.",
      },
      {
        id: "dates",
        title: asString(byId.dates?.title) || "Datas ou prazos importantes",
        text:
          safeShorten(softenPrescriptiveLanguage(asString(byId.dates?.text))) ||
          "Não foi possível confirmar datas ou prazos no documento.",
      },
      {
        id: "terms",
        title: asString(byId.terms?.title) || "📘 Palavras difíceis explicadas",
        text:
          safeShorten(softenPrescriptiveLanguage(asString(byId.terms?.text))) ||
          "Não há termos difíceis relevantes neste documento.",
      },
      {
        id: "whatUsuallyHappens",
        title: asString(byId.whatUsuallyHappens?.title) || "O que normalmente acontece",
        text:
          safeShorten(softenPrescriptiveLanguage(asString(byId.whatUsuallyHappens?.text))) ||
          "Não foi possível confirmar pelo documento.",
      },
    ];

    let notice = safeShorten(asString(parsed?.notice) || NOTICE_DEFAULT, 420);
    if (confidence < 0.45) {
      notice =
        "A imagem parece estar pouco legível, então a explicação pode estar incompleta. " + notice;
    }

    return NextResponse.json({
      ok: true,
      result: {
        confidence,
        cards,
        notice,
      },
    });
  } catch (err) {
    console.error("[/api/analyze]", err);
    return NextResponse.json({ ok: false, error: "Erro interno ao analisar documento" }, { status: 500 });
  }
}
