# Privacidade e Telemetria

Este documento descreve como o Entenda o Documento lida com dados e telemetria.

## O que coletamos
- Imagens do documento: usadas apenas para processamento e descartadas logo apos a analise (ou expiram em ate 10 minutos).
- Texto extraido (OCR) higienizado: usado para Q&A e descartado ao fim da sessao.
- Eventos de uso: eventos anonimizados para entender o funil (ex.: abertura de tela, envio de foto, analise concluida).
- Feedback agregado: contagem de "sim/nao" e motivos de feedback (sem conteudo do documento).
- Metricas de qualidade: contadores agregados por dia (total, JSON invalido, baixa confianca, sanitizer, latencia, retries, erros de Q&A).
- Dados tecnicos e operacionais: IP, status e latencia nos logs; chaves temporarias de rate limit por IP.

## O que nao coletamos
- Historico persistente de documentos por usuario.
- Conteudo completo do documento armazenado de forma permanente.
- Dados sensiveis em texto livre (CPF, CNPJ, email, telefone, linha digitavel) em armazenamento local/servidor.

## Como usamos os dados
- Melhorar a estabilidade e a qualidade do produto.
- Medir conversao e identificar pontos de abandono no fluxo.
- Priorizar melhorias de UX e prompt.
- Aplicar sanitizacao de linguagem e reducao de dados sensiveis quando exibimos o texto.

## Processamento por terceiros
- OpenAI (ou outro provider configurado) recebe imagem e prompts para OCR, analise e Q&A. A retencao segue as politicas do provider.

## Armazenamento local no dispositivo
- Imagem antes do envio: IndexedDB (com fallback em memoria) ate a confirmacao.
- Resultado e `captureId`: sessionStorage (limpo ao fechar a aba).
- Contexto de Q&A: memoria volatil da sessao.

## Onde os dados ficam
- Telemetria de eventos: PostHog (quando habilitado por ambiente).
- Capturas temporarias: Redis/Upstash (ou memoria local do servidor).
- Feedback agregado: Redis/Upstash (quando configurado).
- Metricas de qualidade: Redis/Upstash (ou memoria local quando Redis nao esta configurado).
- Logs de API: Vercel Logs.

## Retencao
- Capturas de imagem: removidas apos a analise ou expiram em ate 10 minutos.
- Texto de OCR e resultado: mantidos apenas durante a sessao (memoria / sessionStorage).
- Eventos de telemetria: seguem a retencao configurada no PostHog.
- Contadores de feedback: agregados por dia.
- Metricas de qualidade: agregadas por dia (sem TTL configurado).
- Rate limit: janelas de 60s por IP.

## Contato
Se tiver duvidas sobre privacidade, entre em contato com o responsavel pelo projeto.
