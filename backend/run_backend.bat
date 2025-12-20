@echo off
setlocal

echo Checking for Local Maven...
set MAVEN_HOME=%~dp0local-maven\apache-maven-3.9.6
set PATH=%MAVEN_HOME%\bin;%PATH%

if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
    echo [ERROR] Maven not found. Please run 'setup_maven.ps1' first or wait for it to finish.
    echo Expected at: %MAVEN_HOME%
    pause
    exit /b 1
)

echo [OK] Found Maven at: %MAVEN_HOME%
echo [INFO] version check:
call mvn -version

echo.
echo ========================================================
echo   🚀 Starting Hey GaKa Backend (Spring Boot)
echo ========================================================
echo.

call mvn spring-boot:run

pause
