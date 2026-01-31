@load
Feature: Captura e analise basica (baseline)
  Como operador
  Quero medir o fluxo principal com baixa carga
  Para garantir latencia e estabilidade iniciais

  @id(LOAD-1)
  Scenario: Captura + analise basica com 1 VU
    Given o sistema em execucao
    When 1 usuario envia captura e analisa por 1 minuto
    Then p95 deve ser menor que 2s
    And taxa de erro deve ser menor que 1%
