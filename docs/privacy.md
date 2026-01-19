# Privacidade e Telemetria

Este documento descreve como o Entenda o Documento lida com dados e telemetria.

## O que coletamos
- Imagens do documento: usadas apenas para processamento e descartadas logo apos a analise.
- Eventos de uso: eventos anonimizados para entender o funil (ex.: abertura de tela, envio de foto, analise concluida).
- Feedback agregado: contagem de "sim/nao" e motivos de feedback (sem conteudo do documento).

## O que nao coletamos
- Conteudo completo do documento.
- Dados sensiveis em texto livre (CPF, RG, endereco, email, telefone).
- Historico de documentos por usuario.

## Como usamos os dados
- Melhorar a estabilidade e a qualidade do produto.
- Medir conversao e identificar pontos de abandono no fluxo.
- Priorizar melhorias de UX e prompt.

## Onde os dados ficam
- Telemetria de eventos: PostHog (quando habilitado por ambiente).
- Feedback agregado: Redis/Upstash (contadores diarios).
- Logs de API: Vercel Logs.

## Retencao
- Imagens: descartadas logo apos a analise.
- Eventos de telemetria: seguem a retencao configurada no PostHog.
- Contadores de feedback: agregados por dia.

## Contato
Se tiver duvidas sobre privacidade, entre em contato com o responsavel pelo projeto.
