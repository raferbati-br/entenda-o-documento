# Matriz de cobertura (BDD + E2E + Carga)

Esta matriz centraliza a cobertura de requisitos (BDD), testes automatizados (E2E)
e cenarios de carga.

## Cobertura BDD x E2E

| ID | Cenario | BDD (feature) | Script |
| --- | --- | --- | --- |
| E2E-1 | Caminho feliz completo | `docs/bdd/fluxo-geral.feature` | `tests/e2e/app.spec.ts` |
| E2E-2 | Falha na analise e recuperacao | `docs/bdd/fluxo-geral.feature` | `tests/e2e/app.spec.ts` |
| E2E-3 | Acessar a home e ver as opcoes principais | `docs/bdd/home.feature` | `tests/e2e/app.spec.ts` |
| E2E-4 (manual) | Iniciar captura pela camera | `docs/bdd/home.feature` | `tests/e2e/app.spec.ts` |
| E2E-5 | Abrir galeria pela home | `docs/bdd/home.feature` | `tests/e2e/app.spec.ts` |
| E2E-6 (manual) | Ver dicas de captura | `docs/bdd/camera.feature` | `tests/e2e/app.spec.ts` |
| E2E-7 (manual) | Tirar foto pela camera | `docs/bdd/camera.feature` | `tests/e2e/app.spec.ts` |
| E2E-8 (manual) | Escolher imagem pela galeria na tela de camera | `docs/bdd/camera.feature` | `tests/e2e/app.spec.ts` |
| E2E-9 | Visualizar a imagem capturada | `docs/bdd/confirmacao.feature` | `tests/e2e/app.spec.ts` |
| E2E-10 (manual) | Trocar a imagem por outra | `docs/bdd/confirmacao.feature` | `tests/e2e/app.spec.ts` |
| E2E-11 | Enviar a imagem para analise | `docs/bdd/confirmacao.feature` | `tests/e2e/app.spec.ts` |
| E2E-12 (manual) | Exibir erro ao enviar a imagem | `docs/bdd/confirmacao.feature` | `tests/e2e/app.spec.ts` |
| E2E-13 | Processamento com sucesso | `docs/bdd/analisando.feature` | `tests/e2e/app.spec.ts` |
| E2E-14 | Erro na analise com mensagem amigavel | `docs/bdd/analisando.feature` | `tests/e2e/app.spec.ts` |
| E2E-15 (manual) | Cancelar a analise em andamento | `docs/bdd/analisando.feature` | `tests/e2e/app.spec.ts` |
| E2E-16 (manual) | Captura ausente | `docs/bdd/analisando.feature` | `tests/e2e/app.spec.ts` |
| E2E-17 | Exibir cards principais do resultado | `docs/bdd/resultado.feature` | `tests/e2e/app.spec.ts` |
| E2E-18 (manual) | Aviso de baixa confianca | `docs/bdd/resultado.feature` | `tests/e2e/app.spec.ts` |
| E2E-19 (manual) | Ler o resultado em voz alta | `docs/bdd/resultado.feature` | `tests/e2e/app.spec.ts` |
| E2E-20 (manual) | Ouvir apenas o resumo | `docs/bdd/resultado.feature` | `tests/e2e/app.spec.ts` |
| E2E-21 (manual) | Compartilhar ou copiar o resultado | `docs/bdd/resultado.feature` | `tests/e2e/app.spec.ts` |
| E2E-22 (manual) | Enviar feedback positivo | `docs/bdd/resultado.feature` | `tests/e2e/app.spec.ts` |
| E2E-23 (manual) | Enviar feedback negativo com motivo | `docs/bdd/resultado.feature` | `tests/e2e/app.spec.ts` |
| E2E-24 (manual) | Iniciar uma nova analise | `docs/bdd/resultado.feature` | `tests/e2e/app.spec.ts` |
| E2E-25 | Abrir o fluxo de perguntas | `docs/bdd/resultado.feature` | `tests/e2e/app.spec.ts` |
| E2E-26 | Acessar a tela de perguntas | `docs/bdd/perguntas.feature` | `tests/e2e/app.spec.ts` |
| E2E-27 (manual) | Perguntas rapidas | `docs/bdd/perguntas.feature` | `tests/e2e/app.spec.ts` |
| E2E-28 (manual) | Enviar uma pergunta valida | `docs/bdd/perguntas.feature` | `tests/e2e/app.spec.ts` |
| E2E-29 (manual) | Erro ao responder uma pergunta | `docs/bdd/perguntas.feature` | `tests/e2e/app.spec.ts` |
| E2E-30 (manual) | Feedback em uma resposta | `docs/bdd/perguntas.feature` | `tests/e2e/app.spec.ts` |
| E2E-31 (manual) | Copiar ou compartilhar uma resposta | `docs/bdd/perguntas.feature` | `tests/e2e/app.spec.ts` |
| E2E-32 (manual) | Ouvir resposta em voz alta | `docs/bdd/perguntas.feature` | `tests/e2e/app.spec.ts` |
| E2E-33 (manual) | Ver documento durante o Q&A | `docs/bdd/perguntas.feature` | `tests/e2e/app.spec.ts` |
| E2E-34 (manual) | Iniciar nova analise a partir do Q&A | `docs/bdd/perguntas.feature` | `tests/e2e/app.spec.ts` |
| E2E-35 (manual) | Acessar o dashboard com token valido | `docs/bdd/metrics.feature` | `tests/e2e/app.spec.ts` |
| E2E-36 (manual) | Bloquear acesso sem token valido | `docs/bdd/metrics.feature` | `tests/e2e/app.spec.ts` |
| E2E-37 (manual) | Baixa confianca no resultado | `docs/bdd/fluxo-geral.feature` | `tests/e2e/app.spec.ts` |
| E2E-38 (manual) | Duvidas apos ver o resultado | `docs/bdd/fluxo-geral.feature` | `tests/e2e/app.spec.ts` |

## Cobertura BDD x LOAD

Objetivo: garantir que os fluxos criticos e suas dependencias tenham cobertura por testes de carga.

| ID | Cenario | Endpoint(s) | Volume alvo | Duracao | Metricas | Script |
| --- | --- | --- | --- | --- | --- | --- |
| LOAD-1 | Captura + analise basica | /api/session-token, /api/capture, /api/analyze | 1 VU (baseline) | 1m | p95 (alvo a definir), taxa de erro (alvo a definir) | tests/load/k6/capture-analyze.js |
| LOAD-2 | OCR dedicado | /api/session-token, /api/ocr | 1 VU (baseline) | 1m | p95 (alvo a definir), taxa de erro (alvo a definir) | - |
| LOAD-3 | Q&A streaming | /api/session-token, /api/qa | 1 VU (baseline) | 1m | p95 (alvo a definir), taxa de erro (alvo a definir), timeout | - |
| LOAD-4 | Feedback | /api/feedback | 1 VU (baseline) | 1m | taxa de erro (alvo a definir) | - |
| LOAD-5 | Stress de captura (picos) | /api/capture | 10-50 VUs | 2-5m | p95 (alvo a definir), taxa de erro (alvo a definir) | - |
| LOAD-6 | Stress de analise (picos) | /api/analyze | 10-50 VUs | 2-5m | p95 (alvo a definir), taxa de erro (alvo a definir) | - |
| LOAD-7 | Redis (rate limit) | bursts em /api/analyze | 10-50 VUs | 2-5m | p95 (alvo a definir), taxa de erro (alvo a definir) | - |
| LOAD-8 | Armazenamento em memoria (capturas) | long run /api/capture + /api/analyze | 1-5 VUs | 10-30m | memoria, taxa de erro (alvo a definir) | - |
| LOAD-9 | Provedor real (LLM) | /api/analyze | 1 VU (baseline) | 1m | p95 (alvo a definir), taxa de erro (alvo a definir) | - |
| LOAD-10 | Qualidade do resultado (amostra valida) | /api/analyze | 1 VU (baseline) | 1m | assert de conteudo, taxa de erro (alvo a definir) | - |

## Checagens

- BDD x E2E:
```
npm run bdd:coverage
```

- BDD x LOAD:
```
npm run load:coverage
```
