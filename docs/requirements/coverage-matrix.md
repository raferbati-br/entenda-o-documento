# Matriz de cobertura (BDD + E2E + Carga)

Esta matriz centraliza a cobertura de requisitos (BDD), testes automatizados (E2E)
e cenarios de carga.

## Cobertura BDD x E2E

| ID | Cenario | Endpoint(s) | BDD (feature) | Teste E2E |
| --- | --- | --- | --- | --- |
| E2E-1 | Caminho feliz completo | /, /confirm, /analyzing, /result | `fluxo-geral.feature` | `fluxo-geral.spec.ts` |
| E2E-2 | Falha na analise e recuperacao | /, /confirm, /analyzing | `fluxo-geral.feature` | `fluxo-geral.spec.ts` |
| E2E-3 | Acessar a home e ver as opcoes principais | / | `home.feature` | `home.spec.ts` |
| E2E-4 (manual) | Iniciar captura pela camera | /camera | `home.feature` | `home.spec.ts` |
| E2E-5 | Abrir galeria pela home | /, /confirm | `home.feature` | `home.spec.ts` |
| E2E-6 (manual) | Ver dicas de captura | /camera | `camera.feature` | `camera.spec.ts` |
| E2E-7 (manual) | Tirar foto pela camera | /camera, /confirm | `camera.feature` | `camera.spec.ts` |
| E2E-8 (manual) | Escolher imagem pela galeria na tela de camera | /camera, /confirm | `camera.feature` | `camera.spec.ts` |
| E2E-9 | Visualizar a imagem capturada | /confirm | `confirmacao.feature` | `confirmacao.spec.ts` |
| E2E-10 (manual) | Trocar a imagem por outra | /confirm, /camera | `confirmacao.feature` | `confirmacao.spec.ts` |
| E2E-11 | Enviar a imagem para analise | /confirm, /analyzing | `confirmacao.feature` | `confirmacao.spec.ts` |
| E2E-12 (manual) | Exibir erro ao enviar a imagem | /confirm | `confirmacao.feature` | `confirmacao.spec.ts` |
| E2E-13 | Processamento com sucesso | /analyzing, /result | `analisando.feature` | `analisando.spec.ts` |
| E2E-14 | Erro na analise com mensagem amigavel | /analyzing | `analisando.feature` | `fluxo-geral.spec.ts` |
| E2E-15 (manual) | Cancelar a analise em andamento | /analyzing | `analisando.feature` | `analisando.spec.ts` |
| E2E-16 (manual) | Captura ausente | /analyzing, / | `analisando.feature` | `analisando.spec.ts` |
| E2E-17 | Exibir cards principais do resultado | /result | `resultado.feature` | `resultado.spec.ts` |
| E2E-18 (manual) | Aviso de baixa confianca | /result | `resultado.feature` | `resultado.spec.ts` |
| E2E-19 (manual) | Ler o resultado em voz alta | /result | `resultado.feature` | `resultado.spec.ts` |
| E2E-20 (manual) | Ouvir apenas o resumo | /result | `resultado.feature` | `resultado.spec.ts` |
| E2E-21 (manual) | Compartilhar ou copiar o resultado | /result | `resultado.feature` | `resultado.spec.ts` |
| E2E-22 (manual) | Enviar feedback positivo | /result | `resultado.feature` | `resultado.spec.ts` |
| E2E-23 (manual) | Enviar feedback negativo com motivo | /result | `resultado.feature` | `resultado.spec.ts` |
| E2E-24 (manual) | Iniciar uma nova analise | /result, /camera | `resultado.feature` | `resultado.spec.ts` |
| E2E-25 | Abrir o fluxo de perguntas | /result, /perguntas | `resultado.feature` | `resultado.spec.ts` |
| E2E-26 | Acessar a tela de perguntas | /perguntas | `perguntas.feature` | `perguntas.spec.ts` |
| E2E-27 (manual) | Perguntas rapidas | /perguntas | `perguntas.feature` | `perguntas.spec.ts` |
| E2E-28 (manual) | Enviar uma pergunta valida | /perguntas | `perguntas.feature` | `perguntas.spec.ts` |
| E2E-29 (manual) | Erro ao responder uma pergunta | /perguntas | `perguntas.feature` | `perguntas.spec.ts` |
| E2E-30 (manual) | Feedback em uma resposta | /perguntas | `perguntas.feature` | `perguntas.spec.ts` |
| E2E-31 (manual) | Copiar ou compartilhar uma resposta | /perguntas | `perguntas.feature` | `perguntas.spec.ts` |
| E2E-32 (manual) | Ouvir resposta em voz alta | /perguntas | `perguntas.feature` | `perguntas.spec.ts` |
| E2E-33 (manual) | Ver documento durante o Q&A | /perguntas | `perguntas.feature` | `perguntas.spec.ts` |
| E2E-34 (manual) | Iniciar nova analise a partir do Q&A | /perguntas, /camera | `perguntas.feature` | `perguntas.spec.ts` |
| E2E-35 (manual) | Acessar o dashboard com token valido | /metrics | `metrics.feature` | `metrics.spec.ts` |
| E2E-36 (manual) | Bloquear acesso sem token valido | /metrics | `metrics.feature` | `metrics.spec.ts` |
| E2E-37 (manual) | Baixa confianca no resultado | /result | `fluxo-geral.feature` | `fluxo-geral.spec.ts` |
| E2E-38 (manual) | Duvidas apos ver o resultado | /result, /perguntas | `fluxo-geral.feature` | `fluxo-geral.spec.ts` |

Rastreabilidade funcional -> carga:
- Tags `@load(LOAD-...)` nos cenarios funcionais sao oficiais e conectam cenarios de negocio
  aos requisitos de carga correspondentes.
- Essas tags nao substituem o `@id(LOAD-...)` nos BDDs de carga, que seguem obrigatorios.
## Cobertura BDD x LOAD

Objetivo: garantir que os cenarios nao funcionais (carga) estejam documentados em BDD de carga e,
quando houver, tenham script automatizado correspondente.

| ID | Cenario | BDD (nao funcional) | Endpoint(s) | Script |
| --- | --- | --- | --- | --- |
| LOAD-1 | Captura + analise basica | `fluxo-basico.feature` | /api/session-token, /api/capture, /api/analyze | capture-analyze.js |
| LOAD-2 | OCR dedicado | `ocr.feature` | /api/session-token, /api/ocr | - |
| LOAD-3 | Q&A streaming | `qa.feature` | /api/session-token, /api/qa | - |
| LOAD-4 | Feedback | `feedback.feature` | /api/feedback | - |
| LOAD-5 | Stress de captura (picos) | `stress-capture.feature` | /api/capture | - |
| LOAD-6 | Stress de analise (picos) | `stress-analyze.feature` | /api/analyze | - |
| LOAD-7 | Redis (rate limit) | `rate-limit.feature` | bursts em /api/analyze | - |
| LOAD-8 | Armazenamento em memoria (capturas) | `memory.feature` | long run /api/capture + /api/analyze | - |
| LOAD-9 | Provedor real (LLM) | `llm-real.feature` | /api/analyze | - |
| LOAD-10 | Qualidade do resultado (amostra valida) | `quality.feature` | /api/analyze | - |

## Checagens

- BDD x E2E:
```
npm run bdd:coverage:e2e
```

- BDD x LOAD (cenarios em `docs/requirements/non-functional/`):
```
npm run bdd:coverage:load
```

