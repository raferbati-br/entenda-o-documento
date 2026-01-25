# Configuracao de ambiente

Este documento descreve as variaveis de ambiente usadas pelo app e como preenche-las.

## Arquivos base
- `.env.example`: lista completa das variaveis.
- `.env.local`: copia local com valores reais (nao commitado).

## Minimo para rodar localmente
- Uma chave de IA: `OPENAI_API_KEY` ou `GOOGLE_API_KEY`
- `API_TOKEN_SECRET`
- `APP_ORIGIN=http://localhost:3000`

## Variaveis

### IA (OpenAI ou Gemini)
- `OPENAI_API_KEY`: chave da API da OpenAI.
- `GOOGLE_API_KEY`: chave da API Gemini (Google AI Studio).
- `LLM_PROVIDER`: provedor de IA. Padrao: `openai`. Valores suportados: `openai` | `gemini`.
- `LLM_MODEL`: modelo usado pelo provedor. Padrao: `gpt-4o-mini`.
- `PROMPT_ID`: prompt principal em `src/ai/prompts`. Padrao: `entendaDocumento.v1`.
- `OCR_PROMPT_ID`: prompt de OCR. Padrao: `entendaDocumento.ocr.v1`.
- `QA_PROMPT_ID`: prompt de perguntas e respostas. Padrao: `entendaDocumento.qa.v1`.
- `ANALYZE_TEXT_ONLY`: quando `true`, a segunda chamada usa somente texto OCR.
- `ANALYZE_TEXT_PROMPT_ID`: prompt de analise para texto. Padrao: `entendaDocumento.text.v1`.
- `ANALYZE_LLM_PROVIDER`: override do provedor para `/api/analyze` (ex.: `openai` ou `gemini`).
- `ANALYZE_OCR_MIN_CHARS`: minimo de caracteres para considerar o OCR suficiente. Padrao: `200`.
- `ANALYZE_OCR_MIN_ALPHA_RATIO`: minimo de proporcao de letras no OCR (0..1). Padrao: `0.3`.
- Defaults e leitura centralizados em `src/lib/llmModel.ts`, `src/lib/promptIds.ts` e `src/lib/llmProvider.ts`.

Exemplo rapido para Gemini:
- `LLM_PROVIDER=gemini`
- `LLM_MODEL=gemini-2.0-flash-lite-001`

### Analise text-only (OCR)
- Custo/latencia: reduz tokens multimodais na segunda chamada quando o OCR e suficiente.
- Qualidade: depende do OCR; quando o texto vem incompleto, o sistema faz fallback para analise com imagem.

### Redis / Upstash (opcional)
Usado para armazenar capturas temporarias, rate limit e contadores agregados.
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Sem Redis, o app usa memoria local (bom para desenvolvimento, nao recomendado em producao).

### Seguranca e origem
- `API_TOKEN_SECRET`: segredo para assinar tokens temporarios de sessao.
- `APP_ORIGIN`: origem permitida para chamadas das APIs (ex.: `http://localhost:3000`).

### Telemetria (opcional)
- `NEXT_PUBLIC_POSTHOG_KEY`: chave publica do PostHog.
- `NEXT_PUBLIC_POSTHOG_HOST`: host do PostHog. Padrao: `https://app.posthog.com`.

### Metricas (opcional)
- `METRICS_DASHBOARD_TOKEN`: token para proteger `/metrics`.
  - Exemplo: `/metrics?token=SEU_TOKEN`
