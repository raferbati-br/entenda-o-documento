# Padrão de Commit

Este arquivo define como o Codex deve criar commits neste repositório.

---

## Criação do commit

Antes de realizar um commit, o Codex deve anunciar explicitamente na conversa:

> 📦 Criação de Commit  
> Tipo: <tipo>  
> Resumo: <resumo curto>  
> Issue: #<id>

Aguardar confirmação implícita (ausência de objeção) antes de executar o commit.

---

## Formato do commit

Formato obrigatório:
<tipo>: <resumo curto> (#<issue>)

---

## Tipos permitidos

- feat
- fix
- refactor
- test
- docs
- chore

---

## Regras

- Usar verbo no **imperativo**.
- Máximo de **72 caracteres** no resumo.
- Não incluir mudanças fora do escopo da issue.
