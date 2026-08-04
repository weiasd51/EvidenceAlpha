$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $ProjectRoot "frontend")

try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5173/" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "EvidenceAlpha Web is already running."
        exit 0
    }
}
catch {}

& node.exe scripts\serve-local.mjs
