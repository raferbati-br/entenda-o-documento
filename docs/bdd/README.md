# BDD e rastreabilidade com E2E

Os requisitos BDD (Gherkin) ficam em `docs/bdd/` e descrevem os fluxos end-to-end.  
Os testes E2E atuais estao em `tests/e2e/` e cobrem um subconjunto desses fluxos.

## Mapeamento BDD x E2E

| BDD (feature) | Cenarios chave | Teste E2E |
| --- | --- | --- |
| `docs/bdd/fluxo-geral.feature` | E2E-1, E2E-2, E2E-37 (manual), E2E-38 (manual) | `tests/e2e/app.spec.ts` |
| `docs/bdd/home.feature` | E2E-3, E2E-4, E2E-5 | `tests/e2e/app.spec.ts` |
| `docs/bdd/camera.feature` | E2E-6, E2E-7, E2E-8 | `tests/e2e/app.spec.ts` |
| `docs/bdd/confirmacao.feature` | E2E-9, E2E-10, E2E-11, E2E-12 | `tests/e2e/app.spec.ts` |
| `docs/bdd/analisando.feature` | E2E-13, E2E-14, E2E-15, E2E-16 | `tests/e2e/app.spec.ts` |
| `docs/bdd/resultado.feature` | E2E-17, E2E-18, E2E-19, E2E-20, E2E-21, E2E-22, E2E-23, E2E-24, E2E-25 | `tests/e2e/app.spec.ts` |
| `docs/bdd/perguntas.feature` | E2E-26, E2E-27, E2E-28, E2E-29, E2E-30, E2E-31, E2E-32, E2E-33, E2E-34 | `tests/e2e/app.spec.ts` |
| `docs/bdd/metrics.feature` | E2E-35, E2E-36 | `tests/e2e/app.spec.ts` |

## Como manter sincronizado
- Quando um fluxo novo for adicionado em `docs/bdd/*.feature`, crie ou ajuste testes em `tests/e2e/`.
- Quando um teste E2E mudar, revise o BDD correspondente.
- Se necessario, adote tags ou IDs nos cenarios para facilitar rastreio.

## Checagem automatizada
Execute:
```
npm run bdd:coverage
```
O comando lista cenarios sem `@id(...)` e IDs sem referencia em testes E2E.
IDs marcados com `@manual` sao ignorados na checagem de cobertura automatizada.
