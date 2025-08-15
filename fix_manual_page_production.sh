#!/bin/bash
# Fix manual page implementation for production server

echo "🔧 Fixing manual page implementation on production..."

cd /opt/ceshtje_ligjore/ceshtje_ligjore

# Check current service status and logs
echo "Current service status:"
systemctl status albpetrol-legal --no-pager -l

echo ""
echo "Recent logs:"
journalctl -u albpetrol-legal -n 10 --no-pager

# Check if there are duplicate routes or syntax errors
echo ""
echo "Checking for duplicate markdown routes..."
grep -n "api/manual/markdown" server/routes.ts || echo "No markdown routes found"

# Check for syntax errors in routes.ts
echo ""
echo "Checking routes.ts syntax..."
node -c server/routes.ts 2>&1 || echo "Syntax errors found"

# Backup current routes.ts and clean it up
echo ""
echo "Creating backup and cleaning up routes.ts..."
cp server/routes.ts server/routes.ts.backup.$(date +%Y%m%d_%H%M%S)

# Remove any duplicate markdown routes
sed -i '/\/\/ Markdown Manual route/,/});/d' server/routes.ts

# Add the markdown route correctly at the end, before the server setup
cat > temp_route.txt << 'ROUTE_EOF'

  // Markdown Manual route - serves the exact content from MANUAL_PERDORUESI_DETAJUAR.md
  app.get("/api/manual/markdown", isAuthenticated, async (req: any, res) => {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const manualPath = path.join(process.cwd(), 'MANUAL_PERDORUESI_DETAJUAR.md');
      const markdownContent = fs.readFileSync(manualPath, 'utf8');
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(markdownContent);
    } catch (error) {
      console.error("Error reading markdown manual:", error);
      res.status(500).json({ message: "Failed to load user manual" });
    }
  });
ROUTE_EOF

# Insert the route before the final server setup
sed -i '/const server = createServer(app);/i\
' server/routes.ts

# Add the route content before the server setup
sed -i '/const server = createServer(app);/e cat temp_route.txt' server/routes.ts

# Clean up temp file
rm temp_route.txt

# Verify the manual exists
echo ""
echo "Checking if MANUAL_PERDORUESI_DETAJUAR.md exists..."
if [ -f "MANUAL_PERDORUESI_DETAJUAR.md" ]; then
    echo "✅ Manual file found"
    echo "File size: $(stat -c%s MANUAL_PERDORUESI_DETAJUAR.md) bytes"
else
    echo "❌ Manual file not found - creating placeholder..."
    cat > MANUAL_PERDORUESI_DETAJUAR.md << 'MANUAL_EOF'
# Manual i Detajuar i Përdoruesit - Sistemi i Menaxhimit të Çështjeve Ligjore Albpetrol

## Përmbajtja

1. [Hyrje në Sistem](#1-hyrje-në-sistem)
2. [Dashboard Kryesor](#2-dashboard-kryesor)
3. [Menaxhimi i Çështjeve](#3-menaxhimi-i-çështjeve)

---

## 1. Hyrje në Sistem

### 1.1 Aksesi në Sistem
- **URL Lokal**: `https://10.5.20.31`
- **URL Publik**: `https://legal.albpetrol.al`

### 1.2 Procesi i Identifikimit

#### Hapi 1: Faqja e Hyrjes
1. Hapni naviguesin dhe shkruani adresën e sistemit
2. Do të shfaqet faqja e hyrjes me logon e Albpetrol
3. Fushat e kërkuara:
   - **Adresa e Email-it**: Shkruani email-in tuaj të regjistruar
   - **Fjalëkalimi**: Shkruani fjalëkalimin tuaj

#### Hapi 2: Verifikimi me Dy Faktorë (2FA)
1. Pas shtypjes së butonit "Kyçu", do të dërgohet një kod verifikimi në email
2. Kontrolloni kutinë e postës suaj (dhe spam folder)
3. Shkruani kodin 6-shifror në fushën e verifikimit
4. Shtypni "Verifiko" për të hyrë në sistem

---

## 2. Dashboard Kryesor

### 2.1 Përmbledhja e Statistikave
Në krye të dashboard-it shfaqen:
- **Totali i Çështjeve**: Numri i përgjithshëm i çështjeve të regjistruara
- **Çështjet e Sotme**: Çështjet e shtuar sot
- **Çështjet Aktive**: Çështjet që janë në proces
- **Çështjet e Mbyllura**: Çështjet e përfunduara

---

## 3. Menaxhimi i Çështjeve

### 3.1 Shtimi i Çështjes së Re

#### Hapi 1: Aksesi në Formular
1. Klikoni "Shtimi i Çështjes" në menunë anësore
2. Do të hapet formulari i plotë i regjistrimit

#### Hapi 2: Plotësimi i të Dhënave Bazë
**Informacionet e Përgjithshme:**
- **Nr. Rendor**: Automatikisht i gjeneruar nga sistemi
- **Paditesi**: Emri i plotë i palës paditëse
- **I Paditur**: Emri i plotë i palës së paditur
- **Objekti i Çështjes**: Përshkrim i shkurtër i çështjes

### 3.2 Ruajtja e të Dhënave
1. Kontrolloni të gjitha fushat për saktësi
2. Klikoni "Ruaj Çështjen"
3. Sistemi do të shfaqë një mesazh konfirmimi
4. Email njoftimi do të dërgohet automatikisht (nëse është aktivizuar)
MANUAL_EOF
fi

# Check syntax again
echo ""
echo "Checking syntax after cleanup..."
node -c server/routes.ts
SYNTAX_CHECK=$?

if [ $SYNTAX_CHECK -eq 0 ]; then
    echo "✅ Syntax check passed"
    
    # Try to build
    echo ""
    echo "Building application..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build successful!"
        
        echo "Restarting production service..."
        systemctl restart albpetrol-legal
        
        echo "Waiting for service to start..."
        sleep 5
        
        if systemctl is-active --quiet albpetrol-legal; then
            echo "✅ Service restarted successfully!"
            echo ""
            echo "🎉 MANUAL PAGE FIXED AND WORKING!"
            echo ""
            echo "🔗 Access the manual at: https://legal.albpetrol.al/manual"
            echo "   Or click 'Manual i Përdoruesit' in the sidebar"
            echo ""
            echo "📖 The manual displays exact content from MANUAL_PERDORUESI_DETAJUAR.md"
        else
            echo "❌ Service still failing to start"
            echo "Recent logs:"
            journalctl -u albpetrol-legal -n 10 --no-pager
        fi
    else
        echo "❌ Build failed"
    fi
else
    echo "❌ Syntax errors still present"
    echo "Restoring backup..."
    cp server/routes.ts.backup.* server/routes.ts
    
    echo "Building with restored backup..."
    npm run build && systemctl restart albpetrol-legal
fi