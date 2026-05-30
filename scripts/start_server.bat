@echo off
setlocal

cd /d "%~dp0.."
set "SERVER_ENTRY=server\main.py"

if not exist "%SERVER_ENTRY%" (
  echo ERROR: Cannot find %SERVER_ENTRY% from %CD%
  exit /b 1
)

if "%~1"=="--check" (
  echo OK: %CD%\%SERVER_ENTRY%
  exit /b 0
)

if defined SIMRP_PYTHON (
  "%SIMRP_PYTHON%" "%SERVER_ENTRY%"
  exit /b %ERRORLEVEL%
)

where python >nul 2>nul
if not errorlevel 1 (
  python "%SERVER_ENTRY%"
  exit /b %ERRORLEVEL%
)

where py >nul 2>nul
if not errorlevel 1 (
  py -3 "%SERVER_ENTRY%"
  exit /b %ERRORLEVEL%
)

echo ERROR: Python 3 was not found. Install Python 3 or set SIMRP_PYTHON.
exit /b 1
