# Acessibilidade (Accessibility)

Este documento descreve as práticas e ferramentas de acessibilidade implementadas no projeto "Entenda o Documento" para garantir que a aplicação seja utilizável por todas as pessoas, incluindo aquelas com deficiências.

## Padrões e Conformidade

O projeto segue as diretrizes de acessibilidade da Web Content Accessibility Guidelines (WCAG) 2.1 nível AA, que é o padrão internacional para acessibilidade web.

## Ferramentas de Validação

### Testes Automatizados

O projeto utiliza as seguintes ferramentas para validação automática de acessibilidade:

1. **@axe-core/playwright**: Integração do axe-core com Playwright para testes E2E de acessibilidade
2. **pa11y-ci**: Ferramenta de linha de comando para testes de acessibilidade em múltiplas páginas

### Executar Testes de Acessibilidade

```bash
# Executar testes de acessibilidade com Playwright
npm run accessibility:e2e

# Executar testes com pa11y-ci (requer servidor rodando)
npm run accessibility:pa11y

# Executar todos os testes de acessibilidade
npm run accessibility
```

## Implementações de Acessibilidade

### 1. Viewport e Zoom

O projeto permite zoom e ampliação de texto para usuários com deficiência visual:

```typescript
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Permite zoom até 500%
  userScalable: true, // Permite zoom por pinça em dispositivos móveis
  themeColor: "#FFFFFF",
};
```

**Requisito WCAG**: 1.4.4 Resize Text (Level AA)

### 2. Rótulos ARIA

Todos os botões de ícones e elementos interativos possuem rótulos descritivos:

```tsx
<IconButton aria-label="Voltar" onClick={onBack}>
  <ArrowBackIcon />
</IconButton>
```

**Requisito WCAG**: 4.1.2 Name, Role, Value (Level A)

### 3. Hierarquia de Cabeçalhos

O projeto utiliza uma hierarquia semântica de cabeçalhos (h1, h2, h3, etc.) para estruturar o conteúdo de forma lógica.

**Requisito WCAG**: 1.3.1 Info and Relationships (Level A)

### 4. Navegação por Teclado

Todos os elementos interativos são acessíveis via teclado (Tab, Enter, Space, etc.).

**Requisito WCAG**: 2.1.1 Keyboard (Level A)

### 5. Contraste de Cores

O projeto utiliza o Material-UI com contraste adequado entre texto e fundo, garantindo legibilidade.

**Requisito WCAG**: 1.4.3 Contrast (Minimum) (Level AA)

## Integração Contínua

O projeto possui um workflow do GitHub Actions que executa testes de acessibilidade automaticamente em cada push e pull request:

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests
on: [push, pull_request]
jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install chromium
      - run: npm run accessibility:e2e
```

## Diretrizes para Desenvolvimento

Ao adicionar novos componentes ou páginas:

1. **Use elementos semânticos**: Prefira `<button>`, `<nav>`, `<main>`, `<article>`, etc. ao invés de `<div>` genéricos
2. **Adicione rótulos descritivos**: Use `aria-label`, `aria-labelledby` ou texto visível para todos os controles interativos
3. **Teste com teclado**: Verifique se todos os elementos interativos são acessíveis via Tab e ativados com Enter/Space
4. **Mantenha contraste adequado**: Use cores com contraste mínimo de 4.5:1 para texto normal e 3:1 para texto grande
5. **Permita zoom**: Não desabilite zoom ou limite a ampliação de texto
6. **Execute os testes**: Rode `npm run accessibility:e2e` antes de commitar

## Páginas Testadas

Os testes de acessibilidade cobrem as seguintes páginas:

- **Home** (`/`): Página inicial com introdução e opções de captura
- **Camera** (`/camera`): Página de preparação para captura de foto
- **Result** (`/result`): Página de resultados da análise
- **Perguntas** (`/perguntas`): Página de perguntas e respostas
- **Metrics** (`/metrics`): Dashboard de métricas (interno)

## Limitações Conhecidas

- **Métricas Dashboard**: O dashboard de métricas (`/metrics`) exclui a regra `scrollable-region-focusable` pois é uma página interna estática com tabelas que não requer foco especial para navegação por teclado.

## Recursos Adicionais

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Documentation](https://www.deque.com/axe/)
- [pa11y Documentation](https://pa11y.org/)
- [Material-UI Accessibility](https://mui.com/material-ui/guides/accessibility/)

## Reporte de Problemas

Se você encontrar problemas de acessibilidade, por favor:

1. Abra uma issue no GitHub descrevendo o problema
2. Inclua o navegador, sistema operacional e tecnologia assistiva (se aplicável)
3. Descreva os passos para reproduzir o problema
4. Se possível, sugira uma solução
