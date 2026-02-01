# Arquitetura

Este projeto utiliza documentação no modelo **C4** como fonte oficial de arquitetura.

A documentação C4 é a **fonte de verdade** arquitetural.

---

## Avaliação arquitetural (obrigatória)

Sempre que implementar uma mudança, o Codex deve:

1. Declarar explicitamente qual **nível C4** é afetado:
   - Context
   - Container
   - Component
   - Code

2. Exibir na conversa, antes da implementação, no formato:

> 🏗️ Avaliação Arquitetural
> Nível C4 afetado: <nível>
> Impacto: <breve descrição>

---

## Diretrizes

- Não introduzir novos containers ou componentes sem justificativa explícita.
- Preferir aderir à arquitetura existente.
- Evitar refatorações estruturais não solicitadas pela issue.
- Mudanças nos níveis **Context** ou **Container** exigem confirmação explícita antes de prosseguir.
- Mudanças em provider, storage, segurança (CSP/headers) ou telemetria exigem
  atualização da documentação C4 e do `docs/architecture/config.md`.

---

## Em caso de dúvida
Se houver qualquer dúvida arquitetural ou risco de impacto estrutural, **interromper a execução e perguntar antes de implementar**.

---

## Local da documentação C4
- `docs/architecture/`
