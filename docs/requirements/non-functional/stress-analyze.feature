@load
Feature: Stress de analise
  Como operador
  Quero validar picos de analise
  Para garantir estabilidade sob burst

  @id(LOAD-6)
  Scenario: Picos de 10 a 50 VUs em analise
    Given o sistema em execucao
    When 10 a 50 usuarios analisam por 2 a 5 minutos
    Then p95 deve ser menor que 4s
    And taxa de erro deve ser menor que 2%
