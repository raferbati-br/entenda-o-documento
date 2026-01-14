# Testes de carga

Os testes de carga usam k6 e apontam para o app local ou uma URL deployada.

Rodar (PowerShell):
```
$env:BASE_URL="http://localhost:3000"; npm run test:load
```

Nota: deixe `npm run dev` rodando em outro terminal.
