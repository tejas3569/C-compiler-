@echo off
title Online C Compiler
echo ===================================================
echo     Starting Online C Compiler & Editor Server
echo ===================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [Error] Node.js is not found in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Start the server in background and open browser
echo Opening Online C Compiler in your browser...
start http://localhost:3000

echo Starting backend server on http://localhost:3000 ...
node local-server.js
pause
