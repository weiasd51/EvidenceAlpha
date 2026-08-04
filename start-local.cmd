@echo off
cd /d "%~dp0"
if not exist "%~dp0.venv\Scripts\python.exe" (
  echo Python environment is missing. Run scripts\setup.ps1 first.
  pause
  exit /b 1
)
if not exist "%~dp0frontend\dist\server\index.js" (
  pushd "%~dp0frontend"
  call npm.cmd run build
  if errorlevel 1 (
    popd
    pause
    exit /b 1
  )
  popd
)
start "EvidenceAlpha API" /min powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-backend.ps1"
start "EvidenceAlpha Web" /min powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-frontend.ps1"
echo Starting EvidenceAlpha...
echo Web: http://127.0.0.1:5173
echo API: http://127.0.0.1:8000/docs
