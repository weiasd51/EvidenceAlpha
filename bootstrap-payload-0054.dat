$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PidFile = Join-Path $ProjectRoot "data\runtime\local-processes.json"

if (-not (Test-Path $PidFile)) {
    Write-Host "No local process record found."
    exit 0
}

$processes = Get-Content -Raw $PidFile | ConvertFrom-Json
foreach ($name in @("frontend", "backend")) {
    $processId = $processes.$name
    if ($processId) {
        Stop-Process -Id $processId -ErrorAction SilentlyContinue
    }
}
Remove-Item -LiteralPath $PidFile -Force
Write-Host "EvidenceAlpha local services stopped."

