# Testes

Sempre que código for alterado, o Codex deve seguir as diretrizes abaixo.

---

## Estratégia de testes

Antes de escrever ou alterar testes, o Codex deve declarar explicitamente na conversa:

> 🧪 Estratégia de Testes  
> Tipo de teste: <unitário | integração | ambos>  
> Justificativa: <breve explicação>

---

## Diretrizes

1. Priorizar testes **unitários**.
2. Usar testes de **integração** apenas quando houver:
   - IO
   - banco de dados
   - APIs externas
3. Adicionar testes apenas quando agregam valor.
4. Manter testes próximos ao código alterado.
5. Garantir que testes existentes continuem passando.
6. Ao alterar arquivos `.feature` ou `docs/requirements/coverage-matrix.md`, rodar `npm run bdd:coverage`.
7. Ao alterar requisitos/fluxos de segurança ou carga, rodar `npm run test:security` e/ou `npm run test:load`.

---

## Execução de testes

O Codex deve:
1. Executar os testes usando o comando padrão.
2. Informar claramente se os testes passaram ou falharam.

Formato esperado na conversa:

> ▶️ Execução de Testes  
> Comando: <comando>  
> Resultado: <sucesso | falha>

---

## Verificação de build

Sempre que o projeto possuir comando de build, o Codex deve:

1. Executar o build antes do commit.
2. Informar explicitamente o resultado do build.

Formato esperado na conversa:

> 🏗️ Verificação de Build  
> Comando: <comando de build>  
> Resultado: <sucesso | falha>

Em caso de falha no build:
- não realizar commit
- corrigir o problema antes de prosseguir

## Comando padrão para rodar testes
- Código: npm run lint
- Testes: npm run test
- Build: npm run build

---

## Critério mínimo
Funcionalidades novas ou alteradas devem estar cobertas por testes adequados.
