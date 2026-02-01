# Documentação

## Arquitetura
- Visão geral C4, diagramas e configurações: `docs/architecture/README.md`
- Diagramas detalhados: `docs/architecture/diagrams/`
- Config e variáveis de ambiente: `docs/architecture/config.md`

## Requisitos
- Visão geral e matrizes: `docs/requirements/README.md` e `docs/requirements/coverage-matrix.md`
- Requisitos funcionais (BDD end-to-end): `docs/requirements/functional/`
- Requisitos não funcionais (carga/resiliência): `docs/requirements/non-functional/`

## Governança
- Privacidade e telemetria: `docs/governance/privacy.md`
- Segurança e varredura automatizada: `docs/governance/security.md`

## Execução local e comandos úteis
- Quickstart (instalação, variáveis e dev) continua descrito no `README.md` principal.
- Comandos de teste e cobertura:
  - `npm run test:unit` e `npm run test:unit:coverage` (detalhes em `tests/unit/README.md`).
  - `npm run test:e2e` e `npm run test:e2e:coverage` (detalhes em `tests/e2e/README.md`).
  - `npm run test:load` e `npm run bdd:coverage:load` (detalhes em `tests/load/README.md` e `docs/requirements/README.md`).
  - `npm run test:security` (OWASP ZAP scan, veja `docs/governance/security.md`).

## BDD e cobertura
- Requisitos funcionais são escritos em Gherkin por módulo: `docs/requirements/functional/`.
- Requisitos de carga seguem o mesmo padrão em `docs/requirements/non-functional/`.
- Cobertura cruzada é verificada por `npm run bdd:coverage`, `npm run bdd:coverage:e2e` e `npm run bdd:coverage:load`.

## Observabilidade e métricas
- Telemetria opcional via PostHog (variáveis em `docs/architecture/config.md`).
- Dashboard interno em `/metrics`, controlado por `METRICS_DASHBOARD_TOKEN` e documentado no `README.md`.
- Logs estruturados descrevem requestId, status, durations e metadados de prompt/modelo.

## Deploy e operações
- Deploy automático via Vercel com variáveis configuradas (veja `README.md` para quickstart).
- Capturas temporárias, rate limit e métricas usam Redis/Upstash quando configurado (`docs/architecture/config.md`).
