@load
Feature: Q&A streaming
  Como operador
  Quero medir streaming de respostas
  Para garantir estabilidade em respostas longas

  @id(LOAD-3)
  Scenario: Q&A streaming com 1 VU baseline
    Given o sistema em execucao
    When 1 usuario envia perguntas por 1 minuto
    Then p95 deve ser menor que 3s
    And taxa de erro deve ser menor que 1%
    And timeouts devem ser menores que 1%
