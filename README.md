# Entenda o Documento

**Entenda o Documento** é um MVP de impacto social que ajuda pessoas a **compreender documentos burocráticos** (cartas bancárias, cobranças, comunicados administrativos etc.) usando **foto + IA multimodal**, com explicações em **português simples e neutro**.  
Faz parte da primeira etapa do Copilot do Cidadão.  
🎯 Foco: empoderamento por compreensão — sem aconselhamento jurídico, médico ou financeiro.

---

## Visão geral

- Captura de foto/galeria → API (`/api/analyze`, `/api/ocr`, `/api/qa`) → prompt multimodal → cards JSON (`confidence`, `cards`, `notice`).  
- Cards suavizados em `src/ai/postprocess.ts` para remover linguagem prescritiva e ocultar dados sensíveis.  
- Suporte a múltiplos provedores (OpenAI, Gemini e mocks) configurados em `src/ai/providers` e controlados por `LLM_PROVIDER`, `LLM_MODEL` e `ANALYZE_*` no `.env`.

---

## Infraestrutura oficial

- Arquitetura C4 e diagramas: `docs/architecture/README.md` e `docs/architecture/diagrams/`.  
- Configurações de prompts, redis, telemetria e tokens: `docs/architecture/config.md`.  
- Requisitos funcionais e não funcionais (BDD): `docs/requirements/README.md`, `docs/requirements/coverage-matrix.md`, `docs/requirements/functional/` e `docs/requirements/non-functional/`.  
- Governança (privacidade, headers obrigatórios e scan OWASP ZAP): `docs/governance/privacy.md` e `docs/governance/security.md`.  
- **Acessibilidade (WCAG 2.1 AA):** `docs/governance/accessibility.md` - Diretrizes, testes automatizados e conformidade com padrões W3C.
- **Publicação mobile (Apple Store e Google Play):** `docs/deployment/mobile-publishing.md` - Guia completo de setup do Capacitor, iOS, Android e submissão às lojas.  
- Detalhes de testes, cobertura, observabilidade e deploy estão centralizados em `docs/README.md`.

---

## Começar localmente

**Pré-requisitos**
- Node.js 18+
- Conta e chave de API (OpenAI ou Gemini)

**Instalação**
- `git clone https://github.com/raferbati-br/entenda-o-documento.git`
- `cd entenda-o-documento`
- `npm install`

**Variáveis mínimas**
- Copie `.env.example` para `.env.local` e defina `OPENAI_API_KEY`, `API_TOKEN_SECRET` e `APP_ORIGIN=http://localhost:3000`.
- Consulte `docs/architecture/config.md` para Redis/Upstash, PostHog, métricas e triggers de `ANALYZE_TEXT_ONLY`.

**Executar**
```bash
npm run dev
```
Acesse http://localhost:3000

---

## Observabilidade, métricas e operações

- Dashboard interno em `/metrics`, protegido por `METRICS_DASHBOARD_TOKEN` (veja `README.md` e `docs/README.md`).  
- Logs estruturados registram `requestId`, `status`, `duration_ms`, `provider`, `model`, `promptId` e `contextSource`.  
- Telemetria é opcional via PostHog; métricas e rate limit usam Redis/Upstash quando configurado, com fallback em memória.  
- Cobertura BDD x E2E x carga monitorada por `npm run bdd:coverage` e `scripts/check-*`. Detalhes em `docs/README.md`.

---

## Aviso legal e contribuições

- Esta aplicação fornece apenas explicações informativas e não substitui orientação profissional (jurídica, financeira ou médica).  
- Todo o repositório usa UTF-8; se houver mojibake, ajuste o editor.  
- Contribuições e discussões são bem-vindas.
