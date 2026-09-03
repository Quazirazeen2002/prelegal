$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ImageName = "prelegal"
$ContainerName = "prelegal-app"
$Port = 8000

docker build -t $ImageName $RepoRoot

docker rm -f $ContainerName 2>$null | Out-Null

docker run `
  --rm `
  --detach `
  --name $ContainerName `
  --publish "${Port}:8000" `
  $ImageName

Write-Host "Prelegal is running at http://localhost:$Port"
Write-Host "Stop it with scripts/stop-windows.ps1"
