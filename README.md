# Entenda o Documento

**Entenda o Documento** é um MVP de impacto social que ajuda pessoas a **compreender documentos burocráticos** (cartas bancárias, cobranças, comunicados administrativos etc.) usando **foto + IA multimodal**, com explicações em **português simples e neutro**.

Este projeto é a **primeira etapa do Copilot do Cidadão**.

> 🎯 Foco: empoderamento por compreensão — não oferece aconselhamento jurídico, médico ou financeiro.

---

## ✨ O que o MVP faz

- 📸 O usuário tira uma foto ou escolhe uma imagem de um documento
- 🤖 A imagem é analisada por um modelo multimodal de IA
- 🧾 O sistema devolve uma explicação simples:
  - O que é o documento
  - O que ele diz
  - Datas relevantes (se houver)
  - O que normalmente acontece em casos semelhantes
  - Avisos importantes
- 🛡️ Sempre com linguagem **não prescritiva** e aviso legal explícito

---

## 🧱 Arquitetura (resumo)

### Frontend
- **Next.js (App Router)**
- Fluxo mobile-first:
- / → /camera → /confirm → /analyzing → /result
- UX pensada para celular (testado em iPhone via ngrok)
- Linguagem acessível e botões grandes

### Backend
- API Routes do Next.js
- `/api/capture`
- Recebe imagem em base64
- Armazena temporariamente em memória
- Retorna `captureId`
- `/api/analyze`
- Recebe `captureId`
- Recupera imagem
- Chama OpenAI Responses API (modelo multimodal)
- Força saída em JSON estruturado
- Pós-processamento de segurança

### Architecture docs (C4)
See: docs/architecture/README.md

---

## 🤖 Integração com IA

- **Modelo:** OpenAI GPT-4o (multimodal)
- **Entrada:** texto + imagem (foto do documento)
- **Saída (JSON):**

```json
{
"whatIs": "string",
"whatSays": "string",
"dates": "string",
"whatUsuallyHappens": "string",
"notice": "string",
"confidence": 0.0
}
```
---

## 🤝 Segurança de Linguagem

- Evita verbos prescritivos (“deve”, “pague”, “faça”)
- Usa linguagem neutra (“o documento informa”, “parece indicar”)
- Confiança sempre limitada entre 0 e 1
- Aviso adicional quando a confiança é baixa

## 🛡️ Privacidade

- As imagens não são armazenadas permanentemente
- São mantidas apenas pelo tempo necessário para análise
- O sistema não cria histórico de documentos do usuário

## 🚀 Como rodar localmente
**Pré-requisitos**
- Node.js 18+
- Conta e chave de API da OpenAI

**Instalação**
- git clone https://github.com/SEU_USUARIO/entenda-o-documento.git
- cd entenda-o-documento
- npm install

**Variáveis de ambiente**

- Crie um .env.local:
OPENAI_API_KEY=sk-...

**Rodar em desenvolvimento**
npm run dev

Acesse:
http://localhost:3000

## ⚠️ Aviso legal
- Esta aplicação fornece apenas explicações informativas sobre documentos.
- Ela não substitui orientação profissional (jurídica, financeira, médica ou administrativa).

## 📌 Status do projeto
- MVP funcional
- Fluxo completo mobile
- Integração multimodal estável
- Próximo passo: robustez de MVP (rate limit, logs, UX de erro)

## 🌱 Visão futura
- Este projeto faz parte de uma iniciativa maior: Copilot do Cidadão, cujo objetivo é reduzir assimetrias de informação e tornar a burocracia mais compreensível para todos.

Contribuições e discussões são bem-vindas.
