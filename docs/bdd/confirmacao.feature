Feature: Confirmacao da imagem
  Como usuario
  Quero revisar a imagem antes de enviar
  Para garantir uma analise correta

  Scenario: Visualizar a imagem capturada
    Given que o usuario acabou de capturar uma imagem
    When ele chega na tela de confirmacao
    Then deve ver a imagem em tela cheia
    And deve poder usar zoom na imagem

  Scenario: Trocar a imagem por outra
    Given que o usuario esta na tela de confirmacao
    When ele clica em "Escolher outra"
    Then a captura deve ser descartada
    And o usuario deve voltar para a camera

  Scenario: Enviar a imagem para analise
    Given que o usuario esta na tela de confirmacao
    When ele clica em "Usar esta"
    Then a imagem deve ser comprimida e enviada
    And deve navegar para a tela de analise

  Scenario: Exibir erro ao enviar a imagem
    Given que o usuario esta na tela de confirmacao
    When ocorre um erro na captura ou no envio
    Then deve ver uma mensagem de erro
    And deve poder fechar a mensagem e tentar novamente

