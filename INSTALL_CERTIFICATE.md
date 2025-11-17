# Install SSL Certificate as Trusted

## Method 1: Automatic (Run as Administrator)
```bash
install-cert.bat
```

## Method 2: Manual Installation

1. **Open Certificate Manager**
   - Press `Win + R`
   - Type `certlm.msc` and press Enter
   - Or run: `mmc.exe` → File → Add/Remove Snap-in → Certificates → Computer Account

2. **Import Certificate**
   - Navigate to: `Trusted Root Certification Authorities` → `Certificates`
   - Right-click → `All Tasks` → `Import...`
   - Browse to: `certs/localhost.pem`
   - Complete the import wizard

3. **Restart Browser**
   - Close all browser windows
   - Restart your browser
   - Visit: https://localhost

## Method 3: Browser-Specific (Chrome/Edge)

1. Go to https://localhost
2. Click "Advanced" on the security warning
3. Click "Proceed to localhost (unsafe)"
4. Click the "Not Secure" icon in address bar
5. Click "Certificate" → "Details" → "Copy to File"
6. Install to "Trusted Root Certification Authorities"

## Verification

After installation, https://localhost should show:
- 🔒 Green lock icon
- "Secure" or "Connection is secure"
- No certificate warnings

## For Development Team

Each developer needs to:
1. Generate certificates: `generate-certs.bat`
2. Install certificate: `install-cert.bat` (as admin)
3. Restart browser

## Production Note

For production, use Let's Encrypt or a commercial CA instead of self-signed certificates.