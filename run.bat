@echo off
setlocal

set "SOURCE=%~1"
if "%SOURCE%"=="" set "SOURCE=main.c"

if not exist "%SOURCE%" (
    echo [Error] File not found: %SOURCE%
    echo Usage: run.bat [source_file.c]
    exit /b 1
)

set "BASENAME=%~n1"
if "%BASENAME%"=="" set "BASENAME=main"
set "OUTFILE=%BASENAME%.exe"

echo ------------------------------------------
echo Compiling %SOURCE% -^> %OUTFILE% ...
echo ------------------------------------------
gcc -Wall -Wextra -O2 "%SOURCE%" -o "%OUTFILE%" -lm
if %errorlevel% neq 0 (
    echo.
    echo [Build Failed] Please check compilation errors above.
    exit /b %errorlevel%
)

echo [Build Succeeded] Running %OUTFILE% ...
echo ------------------------------------------
"%OUTFILE%"
set "EXITCODE=%errorlevel%"
echo.
echo ------------------------------------------
echo Program finished with exit code %EXITCODE%.
exit /b %EXITCODE%
