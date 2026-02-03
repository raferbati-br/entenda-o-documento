# Testes de carga

Os testes de carga usam k6 e apontam para o app local ou uma URL deployada.

## Rodar
(PowerShell)
```
$env:BASE_URL="http://localhost:3000"; npm run test:load
```

### Rodar um cenario especifico
(PowerShell)
```
$env:BASE_URL="http://localhost:3000"; $env:LOAD_ID="LOAD-3"; npm run test:load
```

## Cobertura
```
npm run bdd:coverage:load
```

## Observacoes
- Deixe `npm run dev` rodando em outro terminal.
- A referencia de requisitos nao funcionais fica em `docs/requirements/README.md`.
