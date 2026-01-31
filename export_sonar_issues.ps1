# ===== CONFIG =====
$tokenFile = Join-Path $PSScriptRoot ".env.sonar.local"
$token = $env:SONAR_TOKEN
if (-not $token -and (Test-Path $tokenFile)) {
  $tokenLine = Get-Content $tokenFile | Where-Object { $_ -match "^\s*SONAR_TOKEN=" } | Select-Object -First 1
  if ($tokenLine) {
    $token = $tokenLine -replace "^\s*SONAR_TOKEN=", ""
  }
}
if (-not $token) {
  Write-Host "SONAR_TOKEN nao encontrado. Defina a variavel de ambiente ou crie .env.sonar.local."
  exit 1
}
$organization = "raferbati-br"
$project = "raferbati-br_entenda-o-documento"

# ===== AUTH =====
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${token}:"))

# ===== API URL =====
$issuesUrl = "https://sonarcloud.io/api/issues/search?organization=$organization&componentKeys=$project&statuses=OPEN&ps=100"
$hotspotsUrl = "https://sonarcloud.io/api/hotspots/search?organization=$organization&projectKey=$project&ps=100"

Write-Host "Buscando issues do SonarCloud..."

$issuesResponse = Invoke-RestMethod `
  -Uri $issuesUrl `
  -Headers @{ Authorization = "Basic $base64Auth" } `
  -Method Get

# ===== HOTSPOTS =====
Write-Host "Buscando hotspots de seguranca do SonarCloud..."

$hotspotsResponse = Invoke-RestMethod `
  -Uri $hotspotsUrl `
  -Headers @{ Authorization = "Basic $base64Auth" } `
  -Method Get

# ===== SALVAR JSON =====
$combined = [PSCustomObject]@{
  issues = $issuesResponse.issues
  issues_total = $issuesResponse.total
  hotspots = $hotspotsResponse.hotspots
  hotspots_total = $hotspotsResponse.paging.total
}

# ===== SALVAR JSON =====
$combined | ConvertTo-Json -Depth 12 | Out-File sonar-issues.json

Write-Host "JSON salvo em sonar-issues.json"

# ===== GERAR CSV SIMPLES =====
$issueCsv = $issuesResponse.issues | Select-Object `
  @{ Name = "type"; Expression = { "issue" } },
  key,
  rule,
  severity,
  component,
  line,
  message

$hotspotCsv = $hotspotsResponse.hotspots | Select-Object `
  @{ Name = "type"; Expression = { "hotspot" } },
  key,
  @{ Name = "rule"; Expression = { $_.securityCategory } },
  @{ Name = "severity"; Expression = { $_.vulnerabilityProbability } },
  component,
  line,
  message

$csv = @()
$csv += $issueCsv
$csv += $hotspotCsv

$csv | Export-Csv sonar-issues.csv -NoTypeInformation -Encoding UTF8

Write-Host "CSV salvo em sonar-issues.csv"

# ===== GERAR PROMPT PARA CODEX =====
$prompt = @()

$prompt += "Fix the following Sonar issues."
$prompt += "Do not change behavior."
$prompt += ""

foreach ($issue in $issuesResponse.issues) {

    $file = $issue.component -replace ".*:", ""

    $prompt += "File: $file"
    $prompt += "Line: $($issue.line)"
    $prompt += "Rule: $($issue.rule)"
    $prompt += "Severity: $($issue.severity)"
    $prompt += "Message: $($issue.message)"
    $prompt += ""
}

foreach ($hotspot in $hotspotsResponse.hotspots) {

    $file = $hotspot.component -replace ".*:", ""

    $prompt += "File: $file"
    $prompt += "Line: $($hotspot.line)"
    $prompt += "Rule: HOTSPOT-$($hotspot.securityCategory)"
    $prompt += "Severity: $($hotspot.vulnerabilityProbability)"
    $prompt += "Message: $($hotspot.message)"
    $prompt += ""
}

$prompt | Out-File sonar-codex-prompt.txt

Write-Host "Prompt salvo em sonar-codex-prompt.txt"

# ===== INFO FINAL =====
Write-Host ""
Write-Host "Total issues encontradas:" $issuesResponse.total
Write-Host "Total hotspots encontrados:" $hotspotsResponse.paging.total
Write-Host "Finalizado!"
