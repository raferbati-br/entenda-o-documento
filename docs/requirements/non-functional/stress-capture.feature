@load
Feature: Stress de captura
  Como operador
  Quero validar picos de captura
  Para garantir estabilidade sob burst

  @id(LOAD-5)
  Scenario: Picos de 10 a 50 VUs em captura
    Given o sistema em execucao
    When 10 a 50 usuarios enviam capturas por 2 a 5 minutos
    Then p95 deve ser menor que 4s
    And taxa de erro deve ser menor que 2%
