@echo off
setlocal
echo ==========================================
echo    Alwaha Scanner Agent Setup \u0026 Run
echo ==========================================

:: Try to use 'py' launcher as it seems most reliable on this system
set PY_CMD=py

echo [1/2] Installing required libraries...
%PY_CMD% -m pip install flask flask-cors pywin32 pyserial

if %errorlevel% neq 0 (
    echo [!] 'py' launcher failed, trying 'python'...
    python -m pip install flask flask-cors pywin32 pyserial
    set PY_CMD=python
)

echo.
echo [2/2] Starting the Scanner Agent...
echo.

%PY_CMD% "%~dp0scanner_agent.py"

if %errorlevel% neq 0 (
    echo.
    echo [!] Failed to start. Please ensure:
    echo     1. Python is installed correctly.
    echo     2. You have run: pyenv global (version)
    echo.
)

pause
