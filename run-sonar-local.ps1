$tokenFile = Join-Path $PSScriptRoot ".env.sonar.local"
if (-not $env:SONAR_TOKEN -and (Test-Path $tokenFile)) {
  $tokenLine = Get-Content $tokenFile | Where-Object { $_ -match "^\s*SONAR_TOKEN=" } | Select-Object -First 1
  if ($tokenLine) {
    $env:SONAR_TOKEN = $tokenLine -replace "^\s*SONAR_TOKEN=", ""
  }
}

if (-not $env:SONAR_TOKEN) {
  Write-Host "SONAR_TOKEN nao encontrado. Defina a variavel de ambiente ou crie .env.sonar.local."
  exit 1
}
npm run test:unit:coverage
npx sonar-scanner "-Dsonar.token=$env:SONAR_TOKEN"
