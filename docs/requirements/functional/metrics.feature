@e2e
Feature: Dashboard de metricas
  Como operador do sistema
  Quero visualizar metricas de qualidade
  Para acompanhar saude e desempenho

  @e2e @id(E2E-35)
  Scenario: Acessar o dashboard com token valido
    Given que o token configurado existe
    And o usuario acessa /metrics com o token correto
    Then deve ver tabelas de metricas de Analyze, OCR e Q&A

  @e2e @id(E2E-36)
  Scenario: Bloquear acesso sem token valido
    Given que o token configurado existe
    And o usuario acessa /metrics sem token valido
    Then deve ver a mensagem de token invalido

