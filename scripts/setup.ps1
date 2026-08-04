$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$VenvPath = Join-Path $ProjectRoot ".venv"

if (-not (Test-Path $VenvPath)) {
    python -m venv $VenvPath
}

& (Join-Path $VenvPath "Scripts\python.exe") -m pip install -r (Join-Path $ProjectRoot "requirements-dev.txt")
Push-Location (Join-Path $ProjectRoot "frontend")
try {
    & npm.cmd install
}
finally {
    Pop-Location
}

Write-Host "Setup complete. Double-click start-local.cmd to run the project."
