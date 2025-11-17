@echo off
echo Installing mkcert for local SSL certificates...

REM Check if mkcert is installed
where mkcert >nul 2>nul
if %errorlevel% neq 0 (
    echo mkcert not found. Installing via chocolatey...
    where choco >nul 2>nul
    if %errorlevel% neq 0 (
        echo Please install Chocolatey first: https://chocolatey.org/install
        echo Or download mkcert manually: https://github.com/FiloSottile/mkcert/releases
        pause
        exit /b 1
    )
    choco install mkcert -y
)

REM Create certificates directory
if not exist "certs" mkdir certs

REM Install local CA
mkcert -install

REM Generate certificates for localhost
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1

echo Certificates generated successfully!
echo Files created:
echo - certs/localhost.pem (certificate)
echo - certs/localhost-key.pem (private key)
pause