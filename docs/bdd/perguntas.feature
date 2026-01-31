@e2e
Feature: Perguntas e respostas (Q&A)
  Como usuario
  Quero tirar duvidas sobre o documento
  Para entender detalhes especificos

  @e2e @id(E2E-26)
  Scenario: Acessar a tela de perguntas
    Given que o usuario esta na tela de resultado
    When ele navega para "Tirar duvidas"
    Then deve ver a tela de perguntas

  @e2e @id(E2E-27) @manual
  Scenario: Perguntas rapidas
    Given que o usuario esta na tela de perguntas
    And nao ha historico de perguntas
    Then deve ver perguntas sugeridas
    When ele seleciona uma pergunta sugerida
    Then a pergunta deve preencher o campo de texto

  @e2e @id(E2E-28) @manual @load(LOAD-3)
  Scenario: Enviar uma pergunta valida
    Given que o usuario esta na tela de perguntas
    And ele digitou uma pergunta valida
    When ele envia a pergunta
    Then a pergunta deve aparecer no chat
    And a resposta deve ser transmitida em tempo real

  @e2e @id(E2E-29) @manual
  Scenario: Erro ao responder uma pergunta
    Given que o usuario enviou uma pergunta valida
    When ocorre um erro na resposta
    Then deve ver uma mensagem de erro no chat

  @e2e @id(E2E-30) @manual
  Scenario: Feedback em uma resposta
    Given que o usuario recebeu uma resposta
    When ele marca a resposta como util
    Then o feedback deve ser enviado
    When ele marca a resposta como nao util e escolhe um motivo
    Then o feedback deve ser enviado com o motivo

  @e2e @id(E2E-31) @manual
  Scenario: Copiar ou compartilhar uma resposta
    Given que o usuario recebeu uma resposta
    When ele usa a acao de copiar ou compartilhar
    Then o texto da resposta deve ser copiado ou compartilhado

  @e2e @id(E2E-32) @manual
  Scenario: Ouvir resposta em voz alta
    Given que o navegador suporta leitura em voz alta
    And o usuario recebeu uma resposta
    When ele ativa a leitura da resposta
    Then a resposta deve ser lida

  @e2e @id(E2E-33) @manual
  Scenario: Ver documento durante o Q&A
    Given que o usuario esta na tela de perguntas
    When ele clica em "Ver documento"
    Then deve abrir a visualizacao do documento

  @e2e @id(E2E-34) @manual
  Scenario: Iniciar nova analise a partir do Q&A
    Given que o usuario esta na tela de perguntas
    When ele clica em "Analisar outro"
    Then deve iniciar um novo fluxo de captura
