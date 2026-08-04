$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $ProjectRoot ".venv\Scripts\python.exe"
Set-Location $ProjectRoot

try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 2
    if ($health.status -eq "ok") {
        Write-Host "EvidenceAlpha API is already running."
        exit 0
    }
}
catch {}

& $Python -m backend.seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $Python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
