# Codex – Contratos Operacionais de Delegação

Esta pasta define **como o Codex deve se comportar** neste repositório.
Ela funciona como um **contrato operacional** entre humanos e o agente.

---

## Princípios

- Prompts devem ser **curtos e declarativos**.
- O comportamento do Codex está definido nos arquivos desta pasta.
- Prompts, snippets e skills apenas **referenciam** estes contratos.
- O Codex deve **tornar visível** cada etapa relevante da execução.
- Mudanças de UI/UX exigem `npm run test:accessibility` antes do commit.

---

## Arquivos

- **ISSUE_DELEGATION.md** – fluxo completo para delegação de issues (com passos visíveis)
- **ARCHITECTURE.md** – diretrizes arquiteturais (modelo C4)
- **TESTING.md** – estratégia e execução de testes
- **COMMIT_STYLE.md** – padrão e criação de commits
- **PR_STYLE.md** – padrão e criação de pull requests

---

## Uso padrão

Delegação direta de uma issue:
Issue #123 - seguir .codex/ISSUE_DELEGATION.md

Se algo sair errado:
- **não ajuste o prompt**
- **ajuste o arquivo correto nesta pasta**

Esta pasta é documentação viva e deve evoluir conforme o uso.
