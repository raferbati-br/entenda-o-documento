@load
Feature: Rate limit e Redis
  Como operador
  Quero validar bursts em /api/analyze
  Para garantir aplicacao de rate limit

  @id(LOAD-7)
  Scenario: Bursts de analise
    Given o sistema com Redis configurado
    When ocorrem bursts em /api/analyze por 2 a 5 minutos
    Then p95 deve ser menor que 4s
    And taxa de erro deve ser menor que 2%
