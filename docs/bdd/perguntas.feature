Feature: Perguntas e respostas (Q&A)
  Como usuario
  Quero tirar duvidas sobre o documento
  Para entender detalhes especificos

  Scenario: Acessar a tela de perguntas
    Given que o usuario esta na tela de resultado
    When ele navega para "Tirar duvidas"
    Then deve ver a tela de perguntas

  Scenario: Perguntas rapidas
    Given que o usuario esta na tela de perguntas
    And nao ha historico de perguntas
    Then deve ver perguntas sugeridas
    When ele seleciona uma pergunta sugerida
    Then a pergunta deve preencher o campo de texto

  Scenario: Enviar uma pergunta valida
    Given que o usuario esta na tela de perguntas
    And ele digitou uma pergunta valida
    When ele envia a pergunta
    Then a pergunta deve aparecer no chat
    And a resposta deve ser transmitida em tempo real

  Scenario: Erro ao responder uma pergunta
    Given que o usuario enviou uma pergunta valida
    When ocorre um erro na resposta
    Then deve ver uma mensagem de erro no chat

  Scenario: Feedback em uma resposta
    Given que o usuario recebeu uma resposta
    When ele marca a resposta como util
    Then o feedback deve ser enviado
    When ele marca a resposta como nao util e escolhe um motivo
    Then o feedback deve ser enviado com o motivo

  Scenario: Copiar ou compartilhar uma resposta
    Given que o usuario recebeu uma resposta
    When ele usa a acao de copiar ou compartilhar
    Then o texto da resposta deve ser copiado ou compartilhado

  Scenario: Ouvir resposta em voz alta
    Given que o navegador suporta leitura em voz alta
    And o usuario recebeu uma resposta
    When ele ativa a leitura da resposta
    Then a resposta deve ser lida

  Scenario: Ver documento durante o Q&A
    Given que o usuario esta na tela de perguntas
    When ele clica em "Ver documento"
    Then deve abrir a visualizacao do documento

  Scenario: Iniciar nova analise a partir do Q&A
    Given que o usuario esta na tela de perguntas
    When ele clica em "Analisar outro"
    Then deve iniciar um novo fluxo de captura

