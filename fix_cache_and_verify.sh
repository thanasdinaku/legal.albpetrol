#!/bin/bash
# Comprehensive fix for cache issues and verification

echo "🔧 Fixing cache issues and verifying production deployment..."

# 1. Force rebuild with cache clearing
echo "1. Clearing build cache and rebuilding..."
rm -rf dist/
rm -rf node_modules/.vite/
npm run build

# 2. Add cache-busting headers to static assets
echo "2. Adding cache-busting headers..."
if [ -f "dist/public/index.html" ]; then
    # Add timestamp to assets to force browser cache refresh
    TIMESTAMP=$(date +%s)
    sed -i "s/assets\//assets\/?v=$TIMESTAMP/g" dist/public/index.html
    echo "✅ Cache-busting added to HTML"
else
    echo "❌ index.html not found"
fi

# 3. Restart service with full cleanup
echo "3. Restarting service with full cleanup..."
systemctl stop albpetrol-legal
sleep 2
systemctl start albpetrol-legal
sleep 3

# 4. Verify service is running with correct code
echo "4. Verifying service status..."
systemctl status albpetrol-legal --no-pager

# 5. Test API directly with curl
echo "5. Testing API response structure..."
curl -s -X GET "http://localhost:5000/api/data-entries?page=1&limit=10" \
  -H "Accept: application/json" | grep -o '"pagination":{[^}]*}' || echo "No pagination found"

# 6. Test search functionality specifically
echo "6. Testing search API..."
curl -s -X GET "http://localhost:5000/api/data-entries?search=test&page=1&limit=10" \
  -H "Accept: application/json" | grep -o '"entries":\[[^]]*\]' || echo "No entries found"

# 7. Clear Cloudflare cache (if using Cloudflare)
echo "7. Instructions for clearing Cloudflare cache:"
echo "   Go to Cloudflare dashboard > Caching > Configuration"
echo "   Click 'Purge Everything' to clear cached assets"
echo "   Or run: curl -X POST 'https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache' -H 'Authorization: Bearer {api_token}' -H 'Content-Type: application/json' --data '{\"purge_everything\":true}'"

# 8. Create version check endpoint
echo "8. Adding version check endpoint..."
CURRENT_TIME=$(date)
cat >> server/routes.ts << EOF

  // Version check endpoint for debugging
  app.get('/api/version', (req, res) => {
    res.json({
      version: "filtering-fix-$(date +%Y%m%d_%H%M%S)",
      deployment: "$CURRENT_TIME",
      pagination_fields: ["currentPage", "totalPages", "totalItems", "itemsPerPage"]
    });
  });
EOF

# 9. Rebuild with version endpoint
echo "9. Rebuilding with version endpoint..."
npm run build
systemctl restart albpetrol-legal

echo "10. Testing version endpoint..."
sleep 3
curl -s http://localhost:5000/api/version | jq '.' || echo "Version endpoint not responding"

echo "✅ Cache fix and verification complete!"
echo ""
echo "📋 Next steps:"
echo "1. Clear your browser cache (Ctrl+F5 or Cmd+Shift+R)"
echo "2. Test: https://legal.albpetrol.al/api/version"
echo "3. Test: https://legal.albpetrol.al/data-table"
echo "4. Clear Cloudflare cache if using CDN"