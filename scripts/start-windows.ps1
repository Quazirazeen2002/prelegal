$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ImageName = "prelegal"
$ContainerName = "prelegal-app"
$Port = 8000

docker build -t $ImageName $RepoRoot

docker rm -f $ContainerName 2>$null | Out-Null

$EnvFileArgs = @()
$EnvFilePath = Join-Path $RepoRoot ".env"
if (Test-Path $EnvFilePath) {
    $EnvFileArgs = @("--env-file", $EnvFilePath)
}

docker run `
  --rm `
  --detach `
  --name $ContainerName `
  --publish "${Port}:8000" `
  @EnvFileArgs `
  $ImageName

Write-Host "Prelegal is running at http://localhost:$Port"
Write-Host "Stop it with scripts/stop-windows.ps1"
