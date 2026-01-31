@e2e
Feature: Analise do documento
  Como usuario
  Quero acompanhar o processamento
  Para saber que a analise esta em andamento

  @e2e @id(E2E-13)
  Scenario: Processamento com sucesso
    Given que o usuario enviou uma imagem valida
    When a analise e concluida com sucesso
    Then o resultado deve ser salvo
    And o usuario deve ser redirecionado para a tela de resultado

  @e2e @id(E2E-14)
  Scenario: Erro na analise com mensagem amigavel
    Given que o usuario esta na tela de analise
    When ocorre um erro na OCR ou na analise
    Then deve ver um aviso com titulo e mensagem amigavel
    And deve ver uma acao principal para voltar e tentar novamente

  @e2e @id(E2E-15) @manual
  Scenario: Cancelar a analise em andamento
    Given que o usuario esta na tela de analise
    When ele clica em "Cancelar"
    Then a requisicao deve ser abortada
    And o usuario deve voltar para a camera

  @e2e @id(E2E-16) @manual
  Scenario: Captura ausente
    Given que o usuario acessa a tela de analise sem uma captura valida
    Then deve ser redirecionado para a home
