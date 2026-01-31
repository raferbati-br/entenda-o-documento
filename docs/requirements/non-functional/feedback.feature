@load
Feature: Feedback
  Como operador
  Quero medir o envio de feedback
  Para garantir estabilidade do endpoint de feedback

  @id(LOAD-4)
  Scenario: Feedback com 1 VU baseline
    Given o sistema em execucao
    When 1 usuario envia feedback por 1 minuto
    Then taxa de erro deve ser menor que 1%
