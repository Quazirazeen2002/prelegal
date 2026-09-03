$ErrorActionPreference = "Stop"

$ContainerName = "prelegal-app"

$running = docker ps --format '{{.Names}}' | Select-String -SimpleMatch -Pattern $ContainerName

if ($running) {
    docker stop $ContainerName
    Write-Host "Prelegal stopped."
} else {
    Write-Host "Prelegal is not running."
}
