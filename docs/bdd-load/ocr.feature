@load
Feature: OCR dedicado
  Como operador
  Quero medir o endpoint de OCR isolado
  Para validar latencia do processamento de texto

  @id(LOAD-2)
  Scenario: OCR com 1 VU baseline
    Given o sistema em execucao
    When 1 usuario chama /api/ocr por 1 minuto
    Then p95 deve ser menor que 2s
    And taxa de erro deve ser menor que 1%
