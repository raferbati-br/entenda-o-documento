Feature: Analise do documento
  Como usuario
  Quero acompanhar o processamento
  Para saber que a analise esta em andamento

  Scenario: Processamento com sucesso
    Given que o usuario enviou uma imagem valida
    When a analise e concluida com sucesso
    Then o resultado deve ser salvo
    And o usuario deve ser redirecionado para a tela de resultado

  Scenario: Erro na analise com mensagem amigavel
    Given que o usuario esta na tela de analise
    When ocorre um erro na OCR ou na analise
    Then deve ver um aviso com titulo e mensagem amigavel
    And deve ver uma acao principal para voltar e tentar novamente

  Scenario: Cancelar a analise em andamento
    Given que o usuario esta na tela de analise
    When ele clica em "Cancelar"
    Then a requisicao deve ser abortada
    And o usuario deve voltar para a camera

  Scenario: Captura ausente
    Given que o usuario acessa a tela de analise sem uma captura valida
    Then deve ser redirecionado para a home

