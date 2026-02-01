# Requisitos e rastreabilidade

Os requisitos ficam em `docs/requirements/` e sao divididos em:
- `docs/requirements/functional/` (BDD funcional, fluxos end-to-end)
- `docs/requirements/non-functional/` (BDD nao funcional, carga/resiliencia)

## Matriz
A matriz consolidada fica em:
- `docs/requirements/coverage-matrix.md`

## Checagem
```
npm run bdd:coverage
```

## Tags
- `@id(E2E-<n>)`: identificador unico por cenario funcional.
- `@e2e`: marca cenario de ponta a ponta.
- `@id(LOAD-<n>)`: identificador unico por cenario nao funcional.
- `@load(LOAD-<n>)`: rastreabilidade oficial de carga aplicada em cenarios funcionais,
  indicando ligacao com requisitos nao funcionais correspondentes (BDD funcional -> carga).

## Observacoes
- IDs com `@manual` sao ignorados na checagem automatizada.
- A cobertura de carga considera um cenario coberto quando o ID aparece no BDD nao funcional
  e no codigo de algum script de carga (`tests/load/**` ou `scripts/run-load-test.mjs`).
- As tags `@load(LOAD-...)` em features funcionais sao oficiais para rastrear cobertura de carga
  ligada aos cenarios de negocio e nao substituem a presenca do `@id(LOAD-...)` nos BDDs nao funcionais.
- Use `npm run bdd:coverage:e2e` e `npm run bdd:coverage:load` para checagens separadas.
- Instrucoes de execucao de carga ficam em `tests/load/README.md`.
