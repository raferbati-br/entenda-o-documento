@e2e
Feature: Fluxo geral end-to-end
  Como usuario
  Quero entender o documento do inicio ao fim
  Para obter uma explicacao clara e tirar duvidas

  @e2e @id(E2E-1)
  Scenario: Caminho feliz completo
    Given que o usuario acessa a pagina inicial
    When ele inicia a captura pela camera ou galeria
    And confirma a imagem enviada
    And a analise e concluida com sucesso
    Then deve ver o resultado com os cards principais
    And deve poder compartilhar ou copiar o resultado
    And deve poder iniciar um novo fluxo de analise

  @e2e @id(E2E-2)
  Scenario: Falha na analise e recuperacao
    Given que o usuario enviou uma imagem
    When ocorre um erro na OCR ou na analise
    Then deve ver uma mensagem amigavel de erro
    And deve poder tentar novamente a partir da camera

  @e2e @id(E2E-37) @manual
  Scenario: Baixa confianca no resultado
    Given que a analise retorna baixa confianca
    When o usuario acessa a tela de resultado
    Then deve ver um aviso de baixa confianca
    And deve ter a opcao de refazer a captura

  @e2e @id(E2E-38) @manual
  Scenario: Duvidas apos ver o resultado
    Given que o usuario esta na tela de resultado
    When ele abre o fluxo de perguntas
    Then deve conseguir enviar uma pergunta
    And deve receber uma resposta
