# Delegação de Issues

Sempre que uma issue do GitHub for mencionada, o Codex deve executar os passos abaixo **em ordem**.

Antes de iniciar cada passo, **exibir claramente na conversa qual passo está sendo executado**, no formato:

> 🔹 PASSO X – <descrição curta>

Sempre em **Português**.

---

## Fluxo de execução

### PASSO 0 – Verificação de ambiente
Antes de qualquer ação, verificar:

- repositório Git está limpo (`git status`)
- branch correta está ativa
- GitHub CLI (`gh`) está instalado e autenticado

Se alguma verificação falhar, **interromper a execução e informar o problema**.

---

### PASSO 1 – Leitura da issue
Ler a issue usando `gh issue view`, incluindo:
- descrição
- comentários
- labels relevantes

---

### PASSO 2 – Compreensão do problema
Identificar e explicitar:
- objetivo principal
- critérios de aceite
- restrições técnicas ou de escopo

---

### PASSO 3 – Planejamento
Planejar passos curtos antes de codar, explicando brevemente a abordagem escolhida.

---

### PASSO 4 – Avaliação arquitetural
Avaliar impacto arquitetural conforme `.codex/ARCHITECTURE.md`:
- identificar o nível C4 afetado
- confirmar aderência à arquitetura existente
- evitar mudanças estruturais não solicitadas

---

### PASSO 5 – Implementação
Implementar **apenas** o escopo da issue, mantendo mudanças pequenas e focadas.

---

### PASSO 6 – Testes
Adicionar ou ajustar testes conforme `.codex/TESTING.md`.

---

### PASSO 7 – Validação (testes e build)
Executar:
- testes conforme .codex/TESTING.md
- build do projeto

Confirmar explicitamente que:
- testes passaram
- build compilou com sucesso

---

### PASSO 8 – Commit
Fazer commit seguindo `.codex/COMMIT_STYLE.md`, referenciando a issue.

---

## Regra final
Se houver dúvida de escopo ou arquitetura, **interromper a execução e perguntar antes de continuar**.
