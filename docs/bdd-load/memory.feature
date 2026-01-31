@load
Feature: Armazenamento em memoria
  Como operador
  Quero validar consumo de memoria em capturas longas
  Para evitar esgotamento de memoria em execucoes prolongadas

  @id(LOAD-8)
  Scenario: Long run de captura + analise
    Given o sistema sem Redis configurado
    When 1 a 5 usuarios executam captura e analise por 10 a 30 minutos
    Then memoria deve permanecer abaixo do limite definido
    And taxa de erro deve ser menor que 1%
