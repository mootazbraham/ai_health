# Install SSL Certificate as Trusted Root CA
# Run as Administrator

param(
    [string]$CertPath = "$PSScriptRoot\certs\localhost.pem"
)

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires administrator privileges." -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    # Check if certificate file exists
    if (-not (Test-Path $CertPath)) {
        throw "Certificate file not found: $CertPath"
    }
    
    # Import certificate to Trusted Root Certification Authorities
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($CertPath)
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
    $store.Open("ReadWrite")
    $store.Add($cert)
    $store.Close()
    
    Write-Host "Certificate installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Certificate Details:" -ForegroundColor Cyan
    Write-Host "Subject: $($cert.Subject)" -ForegroundColor White
    Write-Host "Issuer: $($cert.Issuer)" -ForegroundColor White
    Write-Host "Valid Until: $($cert.NotAfter)" -ForegroundColor White
    Write-Host ""
    Write-Host "https://localhost should now show as secure!" -ForegroundColor Green
    Write-Host "You may need to restart your browser for changes to take effect." -ForegroundColor Yellow
    
} catch {
    Write-Host "Error installing certificate: $($_.Exception.Message)" -ForegroundColor Red
}

Read-Host "Press Enter to exit"