#!/bin/bash
# Setup manual page with proper TypeScript handling

echo "🔧 Setting up manual page for production server..."

cd /opt/ceshtje_ligjore/ceshtje_ligjore

echo "=== BACKUP CURRENT STATE ==="
cp server/routes.ts server/routes.ts.manual.backup.$(date +%Y%m%d_%H%M%S)

echo "=== CLEANING DUPLICATE BRACES ==="
# Remove the duplicate closing braces at the end
# Keep everything up to and including "return httpServer;" and one closing brace
head -n -2 server/routes.ts > server/routes.ts.temp
mv server/routes.ts.temp server/routes.ts

echo "Current file ending:"
tail -5 server/routes.ts

echo "=== ADDING MARKDOWN ROUTE ==="
# Add the markdown route before the server creation
sed -i '/const httpServer = createServer(app);/i\
\
  \/\/ Markdown Manual route\
  app.get("\/api\/manual\/markdown", isAuthenticated, async (req: any, res) => {\
    try {\
      const fs = require("fs");\
      const path = require("path");\
      const manualPath = path.join(process.cwd(), "MANUAL_PERDORUESI_DETAJUAR.md");\
      const markdownContent = fs.readFileSync(manualPath, "utf8");\
      res.setHeader("Content-Type", "text\/plain; charset=utf-8");\
      res.send(markdownContent);\
    } catch (error) {\
      console.error("Error reading markdown manual:", error);\
      res.status(500).json({ message: "Failed to load user manual" });\
    }\
  });' server/routes.ts

echo "=== BUILDING APPLICATION ==="
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    
    echo "=== RESTARTING SERVICE ==="
    systemctl restart albpetrol-legal
    
    sleep 5
    
    if systemctl is-active --quiet albpetrol-legal; then
        echo "✅ Service running"
        echo ""
        echo "🎉 MANUAL PAGE SETUP COMPLETE!"
        echo ""
        echo "Access the manual at:"
        echo "• https://legal.albpetrol.al/manual"
        echo "• Click 'Manual i Përdoruesit' in sidebar"
        echo ""
        echo "Login credentials:"
        echo "• Email: it.system@albpetrol.al"
        echo "• Password: admin123"
    else
        echo "❌ Service failed to start"
        journalctl -u albpetrol-legal -n 5 --no-pager
        echo "Restoring backup..."
        cp server/routes.ts.manual.backup.* server/routes.ts
        npm run build && systemctl restart albpetrol-legal
    fi
else
    echo "❌ Build failed"
    echo "Restoring backup..."
    cp server/routes.ts.manual.backup.* server/routes.ts
fi