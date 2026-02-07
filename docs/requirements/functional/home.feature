@e2e
Feature: Home e entrada do fluxo
  Como usuario
  Quero iniciar a leitura de um documento
  Para receber uma explicacao simples

  @e2e @id(E2E-3)
  Scenario: Acessar a home e ver as opcoes principais
    Given que o usuario acessa a pagina inicial
    Then deve ver uma chamada principal explicando o servico
    And deve ver a opcao "Tirar foto"
    And deve ver a opcao "Galeria"

  @e2e @id(E2E-4)
  Scenario: Iniciar captura pela camera
    Given que o usuario esta na home
    When ele clica em "Tirar foto"
    Then deve navegar para a tela de camera

  @e2e @id(E2E-5)
  Scenario: Abrir galeria pela home
    Given que o usuario esta na home
    When ele clica em "Galeria"
    Then o seletor de arquivos deve ser aberto
    And ao escolher uma imagem valida deve seguir para a confirmacao

