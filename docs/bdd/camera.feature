@e2e
Feature: Captura pela camera
  Como usuario
  Quero receber orientacoes antes de tirar a foto
  Para melhorar a qualidade da analise

  @e2e @id(E2E-6) @manual
  Scenario: Ver dicas de captura
    Given que o usuario abriu a tela de camera
    Then deve ver dicas de nitidez, iluminacao e enquadramento
    And deve ver uma dica adicional

  @e2e @id(E2E-7) @manual
  Scenario: Tirar foto pela camera
    Given que o usuario esta na tela de camera
    When ele clica em "Tirar foto"
    Then o dispositivo deve abrir a camera
    And ao capturar uma imagem valida deve seguir para a confirmacao

  @e2e @id(E2E-8) @manual
  Scenario: Escolher imagem pela galeria na tela de camera
    Given que o usuario esta na tela de camera
    When ele clica em "Galeria"
    Then o seletor de arquivos deve ser aberto
    And ao escolher uma imagem valida deve seguir para a confirmacao
