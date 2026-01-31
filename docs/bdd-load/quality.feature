@load
Feature: Qualidade do resultado
  Como operador
  Quero validar a qualidade minima das respostas
  Para evitar regressao de conteudo

  @id(LOAD-10)
  Scenario: Analise com assert de conteudo
    Given um conjunto de imagens de referencia
    When 1 usuario executa analises por 1 minuto
    Then o conteudo deve conter palavras-chave esperadas
    And taxa de erro deve ser menor que 1%
