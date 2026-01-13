Feature: Document analysis

  Scenario: Happy path returns a result
    Given I open the home page
    When I upload a tiny document image
    And I confirm the photo
    Then I should see the explanation result
