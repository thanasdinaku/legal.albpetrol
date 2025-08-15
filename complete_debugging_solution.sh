#!/bin/bash
# Complete debugging solution for production server

echo "🔧 Complete debugging and fix for production server..."

cd /opt/ceshtje_ligjore/ceshtje_ligjore

echo "=== STEP 1: BACKUP AND ANALYZE ==="
cp server/routes.ts server/routes.ts.debug.backup.$(date +%Y%m%d_%H%M%S)

echo "Current routes.ts file end (last 20 lines):"
tail -20 server/routes.ts

echo ""
echo "=== STEP 2: IDENTIFY DUPLICATE BRACES ==="
echo "Lines around the syntax error:"
sed -n '865,880p' server/routes.ts | nl -ba

echo ""
echo "=== STEP 3: CREATE CLEAN ROUTES FILE ==="

# Create a completely clean routes.ts by removing everything after the proper server creation
cat > temp_routes_fix.awk << 'AWK_EOF'
BEGIN { in_final_section = 0; server_found = 0 }

/const httpServer = createServer\(app\);/ {
    print $0
    getline
    if ($0 ~ /return httpServer;/) {
        print $0
        getline
        if ($0 ~ /^}$/) {
            print $0
            server_found = 1
            exit
        }
    }
}

server_found == 0 { print }
AWK_EOF

awk -f temp_routes_fix.awk server/routes.ts > server/routes.ts.clean

# Verify the clean file ends properly
echo "Clean file ending:"
tail -5 server/routes.ts.clean

# Add the markdown route before the server creation
cat > markdown_route.txt << 'ROUTE_EOF'

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

# Insert the route before the server creation
sed '/const httpServer = createServer(app);/e cat markdown_route.txt' server/routes.ts.clean > server/routes.ts.final

# Replace the original file
mv server/routes.ts.final server/routes.ts

# Clean up temp files
rm temp_routes_fix.awk markdown_route.txt

echo ""
echo "=== STEP 4: SYNTAX VERIFICATION ==="
node -c server/routes.ts
SYNTAX_RESULT=$?

if [ $SYNTAX_RESULT -eq 0 ]; then
    echo "✅ Syntax check PASSED"
    
    echo ""
    echo "=== STEP 5: BUILD AND DEPLOY ==="
    npm run build
    BUILD_RESULT=$?
    
    if [ $BUILD_RESULT -eq 0 ]; then
        echo "✅ Build SUCCESSFUL"
        
        echo ""
        echo "=== STEP 6: SERVICE RESTART ==="
        systemctl restart albpetrol-legal
        
        echo "Waiting for service to stabilize..."
        sleep 8
        
        if systemctl is-active --quiet albpetrol-legal; then
            echo "✅ Service RUNNING"
            
            echo ""
            echo "=== STEP 7: VERIFICATION ==="
            echo "Testing local access..."
            curl -k -s -o /dev/null -w "%{http_code}" https://10.5.20.31 || echo "Local test result: $?"
            
            echo ""
            echo "🎉 PRODUCTION FIX COMPLETE!"
            echo ""
            echo "📊 Status Summary:"
            echo "✅ Syntax errors resolved"
            echo "✅ Application built successfully"
            echo "✅ Service restarted and running"
            echo "✅ Manual page route added"
            echo ""
            echo "🔗 Access Points:"
            echo "• Local: https://10.5.20.31"
            echo "• Public: https://legal.albpetrol.al"
            echo "• Manual: https://legal.albpetrol.al/manual"
            echo ""
            echo "🔐 Administrator Access:"
            echo "• Email: it.system@albpetrol.al"
            echo "• Password: admin123"
        else
            echo "❌ Service FAILED to start"
            echo "Recent logs:"
            journalctl -u albpetrol-legal -n 10 --no-pager
        fi
    else
        echo "❌ Build FAILED"
        echo "Build errors detected"
    fi
else
    echo "❌ Syntax check FAILED"
    echo "Restoring backup..."
    cp server/routes.ts.debug.backup.* server/routes.ts
fi

echo ""
echo "=== DEBUGGING COMPLETE ==="