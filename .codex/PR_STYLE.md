# Padrão de Pull Request

Este arquivo define como o Codex deve criar Pull Requests quando solicitado.

---

## Criação do PR

Quando for criar um Pull Request, o Codex deve anunciar explicitamente na conversa:

> 🔀 Criação de Pull Request  
> Título: <título do PR>  
> Issue relacionada: #<id>

---

## Título do PR

O título do PR deve seguir **o mesmo padrão do commit principal**.

Formato:
<tipo>: <resumo curto> (#<issue>)

---

## Descrição do PR

A descrição deve conter, de forma objetiva:

- **Contexto**  
  Breve descrição do problema ou motivação.

- **O que foi feito**  
  Resumo das mudanças implementadas.

- **Como testar**  
  Passos claros para validação.

- **Issue relacionada**  
  Link ou referência à issue.

---

## Checklist

O Codex deve incluir e preencher o checklist abaixo:

- [ ] Escopo respeitado
- [ ] Testes rodados
- [ ] Código revisável

---

## Diretrizes

- Evitar descrições longas ou genéricas.
- Não incluir mudanças fora do escopo da issue.
- Criar PR apenas quando solicitado explicitamente ou quando fizer parte do fluxo definido em `.codex/ISSUE_DELEGATION.md`.
