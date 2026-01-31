# Testes de carga

Os testes de carga usam k6 e apontam para o app local ou uma URL deployada.

Rodar (PowerShell):
```
$env:BASE_URL="http://localhost:3000"; npm run test:load
```

Nota: deixe `npm run dev` rodando em outro terminal.

## Cobertura de carga
A matriz de cenarios de carga esta em `docs/bdd/coverage-matrix.md`. Ela ajuda a acompanhar
quais fluxos criticos possuem testes de carga implementados.

Checagem automatizada:
```
npm run load:coverage
```
