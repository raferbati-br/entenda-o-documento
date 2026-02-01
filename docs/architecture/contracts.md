# Contratos (JSON)

Este documento centraliza os contratos de entrada/saída do pipeline de IA.

## Analyze (cards JSON)

Formato esperado para o resultado de análise (persistido no cliente e retornado por `/api/analyze`):

```json
{
  "confidence": 0.0,
  "cards": [
    { "id": "whatIs", "title": "O que e este documento", "text": "..." },
    { "id": "whatSays", "title": "O que este documento esta comunicando", "text": "..." },
    { "id": "dates", "title": "Datas ou prazos importantes", "text": "..." },
    { "id": "terms", "title": "Palavras dificeis explicadas", "text": "..." },
    { "id": "whatUsuallyHappens", "title": "O que normalmente acontece", "text": "..." }
  ],
  "notice": "string"
}
```

Regras principais:
- `confidence` entre 0 e 1.
- `cards` com os IDs fixos definidos em `src/ai/types.ts`.
- `notice` com aviso informativo quando a confiança e baixa ou a resposta foi suavizada.
