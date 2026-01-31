# Testes E2E

Suite de ponta a ponta com Playwright.

## Preparacao
Instale os navegadores (uma vez):
```
npx playwright install
```

## Rodar
```
npm run test:e2e
```

## Cobertura
```
npm run test:e2e:coverage
```

## Estrutura dos testes
Os cenarios estao divididos por feature/fluxo, com um arquivo `.spec.ts` por modulo:
- `tests/e2e/fluxo-geral.spec.ts`
- `tests/e2e/home.spec.ts`
- `tests/e2e/camera.spec.ts` (manual por enquanto, ainda nao existe)
- `tests/e2e/confirmacao.spec.ts`
- `tests/e2e/analisando.spec.ts`
- `tests/e2e/resultado.spec.ts`
- `tests/e2e/perguntas.spec.ts`
- `tests/e2e/metrics.spec.ts` (manual por enquanto, ainda nao existe)

Helpers compartilhados ficam em `tests/e2e/helpers/`.

## Observacoes
- A cobertura gera relatorio HTML em `test-results/playwright/coverage-report/index.html`.
- Esse script desativa o Turbopack para evitar sourcemaps sectioned.
- O relatorio e por fonte (`src/`), nao por bundle.
