@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ports=5173,8000; foreach($port in $ports){Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue ^| ForEach-Object {Stop-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue}}"
echo EvidenceAlpha local services stopped.
