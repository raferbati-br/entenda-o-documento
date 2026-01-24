# Fluxo da aplicacao

## Fluxo atual (referencia)
Legenda rapida: "acao" = botoes principais, "header" = seta do topo, "sistema" = voltar do navegador, "estado" = desvio automatico. Cores: azul = acao, laranja = header/sistema.
```mermaid
flowchart TD
  %% Entrada
  Home[Home] -->|acao: Galeria| Pick{{Seleciona imagem}}
  Home -->|acao: Tirar foto| Camera[Camera]

  %% Captura
  Camera -->|acao: Galeria| Pick
  Camera -->|acao: Capturar foto| Confirm[Confirmar imagem]
  Camera -->|header/sistema: voltar historico| Home
  Pick -->|acao: Confirmar selecao| Confirm

  Confirm -->|acao: Usar esta imagem| Analyzing[Analisando]
  Confirm -->|acao: Escolher outra| Camera
  Confirm -->|header: voltar| Camera

  %% Processamento
  Analyzing -->|estado: sucesso| Result[Resultado]
  Analyzing -->|estado: erro| AnalyzeError[Erro de analise]
  Analyzing -->|acao: Cancelar| Camera
  Analyzing -.->|estado: sem captureId| Home

  AnalyzeError -->|acao: Tirar nova foto| Camera
  AnalyzeError -->|acao: Cancelar e voltar| Home

  %% Resultado
  Result -->|acao: Tirar duvidas| Perguntas[Perguntas]
  Result -->|acao: Analisar outro| Camera
  Result -->|header: voltar| Home
  Result -.->|estado: sem resultado| Home

  %% Perguntas
  Perguntas -->|acao: Resultado| Result
  Perguntas -->|acao: Documento| DocModal[(Modal do documento)]
  DocModal --> Perguntas
  Perguntas -.->|estado: sem resultado| Home
  linkStyle 0,1,2,3,5,6,7,11,13,14,15,16,19,20 stroke:#1f77b4,stroke-width:2px;
  linkStyle 4,8,17 stroke:#ff7f0e,stroke-width:2px;
```

## Proposta simplificada (para avaliacao)
Legenda rapida: "acao" = botoes principais, "header" = seta do topo, "sistema" = voltar do navegador, "estado" = desvio automatico. Cores: azul = acao, laranja = header/sistema.
```mermaid
flowchart TD
  %% Entrada
  Home[Home] -->|acao: Galeria| Pick{{Seleciona imagem}}
  Home -->|acao: Tirar foto| Camera[Camera]

  %% Captura (um unico caminho de ida e refazer)
  Camera -->|acao: Capturar/Selecionar| Confirm[Confirmar imagem]
  Camera -->|header/sistema: voltar historico| Home
  Pick -->|acao: Confirmar selecao| Confirm
  Confirm -->|acao: Refazer| Camera
  Confirm -->|header: voltar| Camera

  %% Processamento (erro e cancelamento voltam um passo)
  Confirm -->|acao: Usar esta imagem| Analyzing[Analisando]
  Analyzing -->|estado: sucesso| Result[Resultado]
  Analyzing -->|estado: erro| Confirm
  Analyzing -->|acao: Cancelar| Confirm

  %% Resultado (acoes claras e poucas)
  %% Saida para Home apenas via back do sistema/cabecalho (secundario)
  Result -->|acao: Tirar duvidas| Perguntas[Perguntas]
  Perguntas -->|acao: Resultado| Result
  Result -->|acao: Nova analise| Camera
  Result -.->|header/sistema: voltar| Home
  linkStyle 0,1,2,4,5,7,10,11,12,13 stroke:#1f77b4,stroke-width:2px;
  linkStyle 3,6,14 stroke:#ff7f0e,stroke-width:2px;
```
