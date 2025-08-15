#!/bin/bash
# Fix syntax error in server/routes.ts

echo "🔧 Fixing syntax error in server/routes.ts..."

cd /opt/ceshtje_ligjore/ceshtje_ligjore

# Check the problematic line
echo "Checking line 873 and surrounding context..."
sed -n '860,880p' server/routes.ts

echo ""
echo "Looking for syntax issues around line 873..."

# Find and fix unmatched braces
# First, let's see the structure around the error
echo "Context around the error:"
sed -n '870,876p' server/routes.ts

# Create a clean version by removing any malformed route additions
echo ""
echo "Creating clean routes.ts..."

# Backup current file
cp server/routes.ts server/routes.ts.error.backup

# Remove any incomplete or duplicate markdown routes that may have been added incorrectly
# Find the last proper closing of the registerRoutes function
LAST_GOOD_LINE=$(grep -n "const server = createServer(app);" server/routes.ts | cut -d: -f1)
if [ -n "$LAST_GOOD_LINE" ]; then
    echo "Found server creation at line $LAST_GOOD_LINE"
    # Keep everything up to that line, minus 1
    head -n $((LAST_GOOD_LINE - 1)) server/routes.ts > server/routes.ts.temp
    
    # Add the markdown route properly
    cat >> server/routes.ts.temp << 'ROUTE_EOF'

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

  const server = createServer(app);

  return server;
}
ROUTE_EOF
    
    # Replace the original file
    mv server/routes.ts.temp server/routes.ts
    
    echo "✅ Routes file reconstructed"
else
    echo "❌ Could not find server creation line - manual fix needed"
    exit 1
fi

# Check syntax
echo ""
echo "Checking syntax..."
node -c server/routes.ts
SYNTAX_CHECK=$?

if [ $SYNTAX_CHECK -eq 0 ]; then
    echo "✅ Syntax check passed"
    
    # Build and restart
    echo ""
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
            echo "🎉 SYNTAX ERROR FIXED!"
            echo "Manual page should now be accessible at /manual"
        else
            echo "❌ Service failed to start - checking logs..."
            journalctl -u albpetrol-legal -n 5 --no-pager
        fi
    else
        echo "❌ Build failed"
    fi
else
    echo "❌ Syntax errors still present"
    echo "Restoring previous working version..."
    
    # Try to restore from a working backup
    if [ -f "server/routes.ts.backup.$(date +%Y%m%d)*" ]; then
        cp server/routes.ts.backup.$(date +%Y%m%d)* server/routes.ts
        echo "Restored from today's backup"
    else
        echo "No backup found - manual intervention needed"
    fi
fi