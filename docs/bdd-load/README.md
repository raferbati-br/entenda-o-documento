# BDD de carga (nao funcional)

Este diretorio contem cenarios nao funcionais (carga, estresse, resiliencia) em Gherkin,
com IDs `@id(LOAD-<n>)`. Esses IDs sao a referencia oficial para `bdd:load:coverage`.

Regras:
- Cada cenario de carga deve ter `@id(LOAD-<n>)`.
- Metricas e metas (p95, taxa de erro, throughput) devem estar no texto do cenario.
- A matriz em `docs/bdd/coverage-matrix.md` aponta para o script de carga quando existir.

## Como o coverage funciona
O `bdd:load:coverage` considera um cenario coberto quando:
- o `@id(LOAD-<n>)` existe no BDD de carga, e
- o mesmo ID aparece no codigo de algum script de carga (`tests/load/**` ou `scripts/run-load-test.mjs`).
