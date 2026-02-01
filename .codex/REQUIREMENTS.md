# Requisitos

Este projeto utiliza requisitos em **BDD** como fonte oficial de requisitos.

A documentação de requisitos é a **fonte de verdade** funcional e não funcional.

---

## Avaliação de impacto de requisitos (obrigatória)

Sempre que implementar uma mudança, o Codex deve:

1. Declarar explicitamente qual **tipo de requisito** é afetado:
   - Funcional (BDD end-to-end)
   - Não funcional (carga, resiliência)
   - Matriz de cobertura

2. Apontar os **IDs/cenários** e os **arquivos** relacionados (features ou matriz).

3. Exibir na conversa, antes da implementação, no formato:

> ✅ Avaliação de Requisitos
> Tipo afetado: <funcional | não funcional | matriz>
> Impacto: <breve descrição>
> IDs/arquivos: <lista curta>

---

## Diretrizes

- Manter requisitos em `docs/requirements/` (funcionais e não funcionais).
- Não criar ou alterar IDs sem atualizar a matriz de cobertura quando necessário.
- Ao criar novos IDs (@id ou @load), atualizar `docs/requirements/coverage-matrix.md`
  e os scripts de carga relacionados quando aplicável.
- Preferir aderir aos requisitos existentes.
- Mudanças em requisitos **não funcionais** ou na **matriz de cobertura** exigem confirmação explícita antes de prosseguir.

---

## Checagem de cobertura
- `npm run bdd:coverage`
- `npm run bdd:coverage:e2e`
- `npm run bdd:coverage:load`

---

## Local da documentação de requisitos
- `docs/requirements/functional/`
- `docs/requirements/non-functional/`
- `docs/requirements/coverage-matrix.md`
