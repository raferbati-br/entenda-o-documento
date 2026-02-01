# Seguranca

Este documento descreve o minimo esperado para seguranca operacional do projeto, alem de como executar a varredura automatizada.

## Escopo
- App web e APIs expostas pelo Next.js.
- Dependencias e configuracoes que impactam headers e exposicao de informacoes.

## Varredura automatizada (OWASP ZAP)
- Script: `npm run test:security`
- Relatorio: `test-results/zap/zap-report.html`
- O script sobe o build de producao, executa o scan e grava o relatorio.
- O plano de automacao e gerado em `test-results/zap/zap-automation.yaml`.

## Headers obrigatorios
Os endpoints devem expor os seguintes headers:
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

Observacao:
- Atualmente o projeto nao aplica CSP via middleware. Os headers acima sao definidos
  via `next.config.ts`.

### Alertas filtrados
- Regra `10096` (Timestamp Disclosure - Unix) e tratada como falso positivo para `/_next/static/*`.
  Os bundles do Next podem conter valores numericos que o ZAP interpreta como timestamps.

## Reporte responsavel
Se encontrar uma vulnerabilidade:
- Abra uma issue com passos de reproducao e impacto esperado.
- Se possivel, inclua evidencia (logs ou trechos do relatorio ZAP).
