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

## Comando padrão para rodar testes
- `<ex: npm test | pytest | mvn test>`

---

## Critério mínimo
Funcionalidades novas ou alteradas devem estar cobertas por testes adequados.