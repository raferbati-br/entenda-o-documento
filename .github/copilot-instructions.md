# AI Coding Instructions for "Entenda o Documento"

## Architecture Overview
This is a Next.js App Router application that helps users understand bureaucratic documents via photo + AI multimodal analysis. Key components:
- **UI Pages**: Camera capture, analyzing progress, results display, Q&A follow-up
- **API Routes**: `/api/analyze` (main analysis), `/api/ocr` (text extraction), `/api/qa` (questions), `/api/capture` (image storage)
- **AI Pipeline**: Providers (OpenAI/Gemini/Mock), prompts, postprocessing for language softening and data redaction
- **Storage**: Client-side IndexedDB + memory fallback; server-side Redis/Upstash or memory
- **Data Flow**: Photo → OCR → Analyze (text-only or image fallback) → Postprocess → JSON cards output

Reference: `docs/architecture/diagrams/C4.md` for flows, `src/ai/analyzeDocument.ts` for pipeline entry.

## Critical Workflows
- **Development**: `npm run dev` (starts Next.js dev server)
- **Build**: `npm run build` (production build)
- **Testing**: `npm run test` (unit + e2e), `npm run test:unit` (Vitest), `npm run test:e2e` (Playwright), `npm run test:load` (K6), `npm run test:security` (OWASP ZAP)
- **Coverage**: `npm run test:coverage` (all), `npm run bdd:coverage` (BDD cross-check)
- **Linting**: `npm run lint` (ESLint)

Always run tests after changes; use `npm run test:unit` for quick validation.

## Project Conventions
- **Language**: Portuguese simple, neutral tone; avoid prescriptive advice ("você deve" → "o documento indica")
- **AI Prompts**: Stored in `src/ai/prompts/`, selected via env vars (e.g., `PROMPT_ID=entendaDocumento.v1`)
- **Providers**: Implement `LlmProvider` interface; OpenAI uses new `responses.create` API
- **Postprocessing**: `src/ai/postprocess.ts` softens language and redacts sensitive data (CPF, RG, etc. → "***")
- **Stores**: Use `idb-keyval` with memory fallback; server stores in Redis with TTL
- **API Routes**: Use `createRouteContext`, `runCommonGuards`, `safeRecordMetrics` for consistency
- **Error Handling**: Throw descriptive errors (e.g., "ANALYZE_INPUT_MISSING"); use type guards
- **Text Safety**: `safeShorten` to limit lengths; `redactSensitiveData` for privacy
- **Metrics**: Record quality counters, latencies; dashboard at `/metrics`

Example: When adding a new API route, follow `src/app/api/analyze/route.ts` pattern with guards and metrics.

## Integration Points
- **LLM Providers**: OpenAI (responses API), Gemini (generative AI), Mock (for testing)
- **External Storage**: Upstash Redis for captures/rate limits; PostHog for telemetry
- **Client Storage**: IndexedDB via `idb-keyval` for images/results
- **Security**: OWASP ZAP scans; rate limiting via Redis

Configure via `.env.local`: `OPENAI_API_KEY`, `LLM_PROVIDER`, `UPSTASH_REDIS_REST_URL`

## Key Files
- Entry: `src/app/page.tsx`, `src/ai/analyzeDocument.ts`
- API: `src/app/api/analyze/route.ts`, `src/app/api/ocr/route.ts`
- AI: `src/ai/providers/openaiProvider.ts`, `src/ai/postprocess.ts`
- Stores: `src/lib/captureStore.ts`, `src/lib/captureStoreServer.ts`
- Config: `docs/architecture/config.md`, `src/lib/llmProvider.ts`