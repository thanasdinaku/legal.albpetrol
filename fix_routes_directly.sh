#!/bin/bash
# Fix the duplicate closing braces in server/routes.ts

echo "🔧 Fixing duplicate closing braces in server/routes.ts..."

cd /opt/ceshtje_ligjore/ceshtje_ligjore

# Backup the current file
cp server/routes.ts server/routes.ts.broken.backup

# Remove the duplicate closing braces at the end
# The file should end with: const httpServer = createServer(app); return httpServer; }
echo "Removing duplicate closing braces..."

# Find the line with "const httpServer = createServer(app);" and keep everything up to the next closing brace
awk '
/const httpServer = createServer\(app\);/ {
    print $0
    getline
    print $0  # print "return httpServer;"
    getline  
    print $0  # print the closing brace "}"
    exit
}
{ print }
' server/routes.ts > server/routes.ts.fixed

# Replace the original file
mv server/routes.ts.fixed server/routes.ts

# Add the markdown route before the final server creation
sed -i '/const httpServer = createServer(app);/i\
\
  \/\/ Markdown Manual route - serves the exact content from MANUAL_PERDORUESI_DETAJUAR.md\
  app.get("\/api\/manual\/markdown", isAuthenticated, async (req: any, res) => {\
    try {\
      const fs = require("fs");\
      const path = require("path");\
      \
      const manualPath = path.join(process.cwd(), "MANUAL_PERDORUESI_DETAJUAR.md");\
      const markdownContent = fs.readFileSync(manualPath, "utf8");\
      \
      res.setHeader("Content-Type", "text/plain; charset=utf-8");\
      res.send(markdownContent);\
    } catch (error) {\
      console.error("Error reading markdown manual:", error);\
      res.status(500).json({ message: "Failed to load user manual" });\
    }\
  });' server/routes.ts

echo "Checking syntax..."
node -c server/routes.ts

if [ $? -eq 0 ]; then
    echo "✅ Syntax check passed"
    
    echo "Building application..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build successful!"
        
        echo "Restarting service..."
        systemctl restart albpetrol-legal
        
        sleep 5
        
        if systemctl is-active --quiet albpetrol-legal; then
            echo "✅ Service running successfully!"
            echo ""
            echo "🎉 ROUTES FILE FIXED!"
            echo "Manual page accessible at: https://legal.albpetrol.al/manual"
        else
            echo "❌ Service failed - checking logs..."
            journalctl -u albpetrol-legal -n 5 --no-pager
        fi
    else
        echo "❌ Build failed"
    fi
else
    echo "❌ Syntax still broken - restoring backup..."
    cp server/routes.ts.broken.backup server/routes.ts
fi