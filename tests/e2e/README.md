# Testes E2E

Suite de ponta a ponta com Playwright.

Instale os navegadores (uma vez):
```
npx playwright install
```

Rodar:
```
npm run test:e2e
```

Cobertura E2E (gera relatório HTML em `test-results/playwright/coverage-report/index.html`):
```
npm run test:e2e:coverage
```

Observações:
- Esse script desativa o Turbopack para evitar sourcemaps sectioned.
- O relatório é por fonte (`src/`), não por bundle.
