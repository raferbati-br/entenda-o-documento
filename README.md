# Entenda o Documento

**Entenda o Documento** é um MVP de impacto social que ajuda pessoas a **compreender documentos burocráticos** (cartas bancárias, cobranças, comunicados administrativos etc.) usando **foto + IA multimodal**, com explicações em **português simples e neutro**.

Este projeto é a **primeira etapa do Copilot do Cidadão**.

> 🎯 Foco: empoderamento por compreensão — não oferece aconselhamento jurídico, médico ou financeiro.

---

## ✨ O que o MVP faz

- 📸 O usuário tira uma foto ou escolhe uma imagem de um documento
- 🤖 A imagem é analisada por um modelo multimodal de IA
- 🧾 O sistema devolve uma explicação simples:
  - O que é o documento
  - O que ele diz
  - Datas relevantes (se houver)
  - O que normalmente acontece em casos semelhantes
  - Avisos importantes
- 🛡️ Sempre com linguagem **não prescritiva** e aviso legal explícito

---

## 🧱 Arquitetura (resumo)

### Frontend
- **Next.js (App Router)**
- Fluxo mobile-first:
- / → /camera → /confirm → /analyzing → /result
- UX pensada para celular (testado em iPhone via ngrok)
- Linguagem acessível e botões grandes

### Backend
- API Routes do Next.js
- `/api/capture`
- Recebe imagem em base64
- Armazena temporariamente no Redis (Upstash) com TTL
- Retorna `captureId`
- `/api/analyze`
- Recebe `captureId`
- Recupera imagem do Redis
- Chama OpenAI Responses API (modelo multimodal)
- Força saída em JSON estruturado
- Pós-processamento de segurança

### Architecture docs (C4)
See: docs/architecture/README.md

---

## 🤖 Integração com IA

- **Modelo:** OpenAI GPT-4o (multimodal)
- **Entrada:** texto + imagem (foto do documento)
- **Saída (JSON):**

```json
{
"whatIs": "string",
"whatSays": "string",
"dates": "string",
"whatUsuallyHappens": "string",
"notice": "string",
"confidence": 0.0
}
```
---

## 🤝 Segurança de Linguagem

- Evita verbos prescritivos (“deve”, “pague”, “faça”)
- Usa linguagem neutra (“o documento informa”, “parece indicar”)
- Confiança sempre limitada entre 0 e 1
- Aviso adicional quando a confiança é baixa

## 🛡️ Privacidade

- As imagens não são armazenadas permanentemente
- São mantidas apenas pelo tempo necessário para análise
- O sistema não cria histórico de documentos do usuário

## 🚀 Como rodar localmente
**Pré-requisitos**
- Node.js 18+
- Conta e chave de API da OpenAI

**Instalação**
- git clone https://github.com/raferbati-br/entenda-o-documento.git
- cd entenda-o-documento
- npm install

**Variáveis de ambiente**

Crie um `.env.local` com:

```
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4o
LLM_PROVIDER=openai
PROMPT_ID=entendaDocumento.v1
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
API_TOKEN_SECRET=...
APP_ORIGIN=https://seu-app.vercel.app
```

Notas:
- `LLM_MODEL`: modelo usado pelo provider (padrão: `gpt-4o`)
- `LLM_PROVIDER`: provider da IA (padrão: `openai`)
- `PROMPT_ID`: prompt registrado em `src/ai/prompts` (padrão: `entendaDocumento.v1`)
- `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`: usados para persistir capturas entre instâncias (recomendado em produção)
- Se as variáveis do Redis não estiverem definidas, o app usa memória local (bom para desenvolvimento, não recomendado em produção)
- Limite básico: 5 req/min por IP em `/api/capture` e `/api/analyze` (fallback local quando Redis não está configurado)
- `API_TOKEN_SECRET`: segredo para assinar tokens temporários de sessão
- `APP_ORIGIN`: origem permitida para chamadas das APIs (ex.: domínio do Vercel)

**Rodar em desenvolvimento**
npm run dev

Acesse:
http://localhost:3000

## ✅ Testes (E2E)
Instale os navegadores do Playwright (uma vez):
```
npx playwright install
```

Rode os testes:
```
npm run test:e2e
```


## Deploy (Vercel)
1) Crie um projeto no Vercel e conecte o repositório.
2) Configure as variáveis de ambiente (`OPENAI_API_KEY` e opcionais acima).
3) Deploy automático via push na branch `main`.

## Observabilidade (logs)
Os endpoints registram logs estruturados com:
- `requestId`, `status`, `duration_ms`, `ip`
- Em `/api/analyze`: `provider`, `model`, `promptId`

Onde ver:
- Local: terminal do `npm run dev`
- Vercel: Dashboard → Logs/Functions

## ⚠️ Aviso legal
- Esta aplicação fornece apenas explicações informativas sobre documentos.
- Ela não substitui orientação profissional (jurídica, financeira, médica ou administrativa).

## 📌 Status do projeto
- MVP funcional
- Fluxo completo mobile
- Integração multimodal estável
- Próximo passo: robustez de MVP (rate limit, logs, UX de erro)

## 🌱 Visão futura
- Este projeto faz parte de uma iniciativa maior: Copilot do Cidadão, cujo objetivo é reduzir assimetrias de informação e tornar a burocracia mais compreensível para todos.

Contribuições e discussões são bem-vindas.

## Encoding
Este repositório usa UTF-8. Se você vir caracteres quebrados, configure seu editor para UTF-8.
