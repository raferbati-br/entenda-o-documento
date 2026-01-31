@load
Feature: Provedor real de LLM
  Como operador
  Quero medir latencia com provedor real
  Para validar comportamento em producao

  @id(LOAD-9)
  Scenario: Analise com LLM real (baseline)
    Given o provedor real configurado
    When 1 usuario envia analises por 1 minuto
    Then p95 deve ser menor que 5s
    And taxa de erro deve ser menor que 2%
