@echo off
echo Installing localhost SSL certificate as trusted...

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo This script requires administrator privileges.
    echo Please run as administrator.
    pause
    exit /b 1
)

REM Install certificate to Trusted Root Certification Authorities
certlm -add certs\localhost.pem -s root

echo Certificate installed successfully!
echo You may need to restart your browser for changes to take effect.
echo.
echo The certificate is now trusted for:
echo - localhost
echo - 127.0.0.1
echo.
pause