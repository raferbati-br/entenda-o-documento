# BDD e rastreabilidade com E2E

Os requisitos BDD (Gherkin) ficam em `docs/bdd/` e descrevem os fluxos end-to-end.  
Os testes E2E atuais estao em `tests/e2e/` e cobrem um subconjunto desses fluxos.

## Matriz unificada
A matriz de cobertura completa (BDD, E2E e carga) foi movida para:
- `docs/bdd/coverage-matrix.md`

## Como manter sincronizado
- Quando um fluxo novo for adicionado em `docs/bdd/*.feature`, crie ou ajuste testes em `tests/e2e/`.
- Quando um teste E2E mudar, revise o BDD correspondente.
- Use tags para rastrear cobertura e conectar com testes automatizados.

## Checagem automatizada
Execute:
```
npm run bdd:coverage
```
O comando lista cenarios sem `@id(...)` e IDs sem referencia em testes E2E.
IDs marcados com `@manual` sao ignorados na checagem de cobertura automatizada.

## Tags usadas nos cenarios
- `@id(E2E-<n>)`: identificador unico por cenario para rastrear BDD x E2E.
- `@e2e`: marca cenario de ponta a ponta (usado para organizacao e filtros).
- `@load(LOAD-<n>)`: relaciona o cenario BDD a um caso de carga da matriz.

## Relacao com testes de carga
Os cenarios de carga (nao funcionais) sao documentados em `docs/bdd-load/` e
relacionados na matriz `docs/bdd/coverage-matrix.md`.
Para detalhes de regras e cobertura, veja `docs/bdd-load/README.md`.
