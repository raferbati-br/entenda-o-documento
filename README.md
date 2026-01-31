# Entenda o Documento

**Entenda o Documento** é um MVP de impacto social que ajuda pessoas a **compreender documentos burocráticos** (cartas bancárias, cobranças, comunicados administrativos etc.) usando **foto + IA multimodal**, com explicações em **português simples e neutro**.

Este projeto é a **primeira etapa do Copilot do Cidadão**.

> 🎯 Foco: empoderamento por compreensão — não oferece aconselhamento jurídico, médico ou financeiro.

---

## ✅ O que o MVP faz

- O usuário tira uma foto ou escolhe uma imagem de um documento
- A imagem é analisada por um modelo multimodal de IA
- O sistema devolve uma explicação simples:
  - O que é o documento
  - O que ele diz
  - Datas relevantes (se houver)
  - O que normalmente acontece em casos semelhantes
  - Avisos importantes
- Permite perguntas curtas sobre o documento (Q&A)
- Permite ouvir a explicação (leitura em voz alta) e compartilhar o resumo
- Coleta feedback simples (sim/não) para melhorar a qualidade
- Sempre com linguagem **não prescritiva** e aviso legal explícito

---

## 🧱 Arquitetura

Visão geral e endpoints em `docs/architecture/README.md`.

---

## 🤖 Integração com IA

- **Modelo:** OpenAI GPT-4o-mini (multimodal)
- **Entrada:** texto + imagem (foto do documento)
- **Saída (JSON):**

```json
{
  "confidence": 0.0,
  "cards": [
    { "id": "whatIs", "title": "O que e este documento", "text": "..." },
    { "id": "whatSays", "title": "O que este documento esta comunicando", "text": "..." },
    { "id": "dates", "title": "Datas ou prazos importantes", "text": "..." },
    { "id": "terms", "title": "Palavras dificeis explicadas", "text": "..." },
    { "id": "whatUsuallyHappens", "title": "O que normalmente acontece", "text": "..." }
  ],
  "notice": "string"
}
```

---

## 🛡️ Segurança de linguagem

- Evita verbos prescritivos ("deve", "pague", "faça")
- Usa linguagem neutra ("o documento informa", "parece indicar")
- Confiança sempre limitada entre 0 e 1
- Aviso adicional quando a confiança é baixa

## 🔒 Privacidade

- Capturas são temporárias e não há histórico persistente por usuário.
- Telemetria é opcional e não inclui conteúdo do documento.
- Detalhes em `docs/governance/privacy.md`.

## 🚀 Como rodar localmente
**Pré-requisitos**
- Node.js 18+
- Conta e chave de API da OpenAI

**Instalação**
- git clone https://github.com/raferbati-br/entenda-o-documento.git
- cd entenda-o-documento
- npm install

**Variáveis de ambiente**

Copie `.env.example` para `.env.local` e preencha ao menos:
- `OPENAI_API_KEY`
- `API_TOKEN_SECRET`
- `APP_ORIGIN=http://localhost:3000`

Detalhes das variáveis (Redis, PostHog, métricas e prompts/modelo) estão em `docs/architecture/config.md`.

**Rodar em desenvolvimento**
```
npm run dev
```

Acesse:
http://localhost:3000

---

## ✅ Testes

Instruções completas:
- `tests/e2e/README.md`
- `tests/unit/README.md`
- `tests/load/README.md`

Resumo rápido:
```
npm run test:unit
npm run test:e2e
npm run test:e2e:coverage
npm run test:coverage
npm run load:coverage
```

---

## 🧾 BDD (requisitos em Gherkin)
Os fluxos end-to-end estão documentados em `docs/requirements/functional/`, separados por módulo/feature.

Destaque:
- `docs/requirements/functional/fluxo-geral.feature` (visão macro do fluxo completo)

Rastreabilidade BDD x E2E:
- `docs/requirements/README.md`
- `docs/requirements/coverage-matrix.md`

---

## 📊 Como interpretar coberturas
- `npm run bdd:coverage`: cobertura de requisitos (rastreabilidade BDD → E2E). Não mede execução de código.
- `npm run test:e2e:coverage`: cobertura de código exercitada pelos testes E2E.
- `npm run test:unit:coverage`: cobertura de código exercitada pelos testes unitários.
- `npm run load:coverage`: cobertura de cenarios de carga (matriz vs tags @load no BDD).

Interpretação combinada:
- BDD alto + E2E baixo → requisitos rastreados, mas testes podem ser superficiais.
- BDD baixo + E2E alto → muita execução, pouca rastreabilidade.
- Unit alto + E2E baixo → lógica interna coberta, fluxo real menos exercitado.
- Todos altos → melhor cenário (requisito ligado a testes + boa execução de código).

---

## Deploy (Vercel)
1) Crie um projeto no Vercel e conecte o repositório.
2) Configure as variáveis de ambiente (veja `.env.example`).
3) Deploy automático via push na branch `main`.

## Dashboard de metricas
Acesse `/metrics` para ver contadores agregados (ultimos 7 dias). Se `METRICS_DASHBOARD_TOKEN` estiver definido, use `/metrics?token=SEU_TOKEN`.

## Observabilidade (logs)
Os endpoints registram logs estruturados com:
- `requestId`, `status`, `duration_ms`, `ip`
- Em `/api/analyze`, `/api/ocr` e `/api/qa`: `provider`, `model`, `promptId`
- Em `/api/feedback`: `helpful`, `reason`, `confidenceBucket`, `contextSource`

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

## 🔭 Visão futura
- Este projeto faz parte de uma iniciativa maior: Copilot do Cidadão, cujo objetivo é reduzir assimetrias de informação e tornar a burocracia mais compreensível para todos.

Contribuições e discussões são bem-vindas.

## Encoding
Este repositório usa UTF-8. Se você vir caracteres quebrados, configure seu editor para UTF-8.
