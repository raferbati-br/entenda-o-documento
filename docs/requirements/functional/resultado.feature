@e2e
Feature: Resultado da analise
  Como usuario
  Quero ler a explicacao do documento
  Para entender o conteudo com clareza

  @e2e @id(E2E-17) @load(LOAD-10)
  Scenario: Exibir cards principais do resultado
    Given que a analise terminou com sucesso
    When o usuario acessa a tela de resultado
    Then deve ver os cards principais do documento
    And deve ver um indicador de confianca

  @e2e @id(E2E-18)
  Scenario: Aviso de baixa confianca
    Given que o resultado tem baixa confianca
    When o usuario acessa a tela de resultado
    Then deve ver um aviso de foto dificil de ler
    And deve poder refazer a captura

  @e2e @id(E2E-19) @manual
  Scenario: Ler o resultado em voz alta
    Given que o navegador suporta leitura em voz alta
    And o usuario esta na tela de resultado
    When ele inicia a leitura
    Then o texto completo deve ser lido
    And o usuario pode interromper a leitura

  @e2e @id(E2E-20) @manual
  Scenario: Ouvir apenas o resumo
    Given que o navegador suporta leitura em voz alta
    And o resumo esta disponivel
    When o usuario clica em "Ouvir resumo"
    Then o resumo deve ser lido em partes

  @e2e @id(E2E-21)
  Scenario: Compartilhar ou copiar o resultado
    Given que o usuario esta na tela de resultado
    When ele usa a acao de compartilhar
    Then o sistema deve abrir o compartilhamento nativo ou copiar o texto

  @e2e @id(E2E-22) @load(LOAD-4)
  Scenario: Enviar feedback positivo
    Given que o usuario esta na tela de resultado
    When ele marca o resultado como util
    Then o feedback deve ser enviado

  @e2e @id(E2E-23) @load(LOAD-4)
  Scenario: Enviar feedback negativo com motivo
    Given que o usuario esta na tela de resultado
    When ele marca o resultado como nao util e escolhe um motivo
    Then o feedback deve ser enviado com o motivo

  @e2e @id(E2E-24)
  Scenario: Iniciar uma nova analise
    Given que o usuario esta na tela de resultado
    When ele clica em "Analisar Outro"
    Then deve iniciar um novo fluxo de captura

  @e2e @id(E2E-25)
  Scenario: Abrir o fluxo de perguntas
    Given que o usuario esta na tela de resultado
    When ele clica em "Tirar duvidas"
    Then deve navegar para a tela de perguntas

