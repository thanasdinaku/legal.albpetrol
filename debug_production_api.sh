#!/bin/bash
# Deep diagnostic script for production API debugging

echo "🔍 Comprehensive production API debugging..."

# 1. Check if the API endpoint responds correctly
echo "1. Testing API endpoint response structure..."
curl -s -X GET "https://legal.albpetrol.al/api/data-entries?page=1&limit=10" \
  -H "Accept: application/json" \
  -H "Cookie: connect.sid=test" | jq '.' || echo "API not responding with JSON"

# 2. Check local API response structure
echo "2. Testing local API response..."
curl -s -X GET "http://localhost:5000/api/data-entries?page=1&limit=10" \
  -H "Accept: application/json" | jq '.' || echo "Local API not responding"

# 3. Verify pagination field names in current build
echo "3. Checking pagination fields in current server code..."
grep -A 10 "pagination:" server/routes.ts

# 4. Check if the built server has the correct structure
echo "4. Checking built server file..."
if [ -f "dist/index.js" ]; then
    grep -A 5 -B 5 "pagination" dist/index.js || echo "No pagination found in built file"
else
    echo "Built file dist/index.js not found"
fi

# 5. Check service logs for errors
echo "5. Recent service logs..."
journalctl -u albpetrol-legal -n 20 --no-pager

# 6. Test with authentication
echo "6. Testing with proper session..."
COOKIE=$(curl -s -c - -X POST "https://legal.albpetrol.al/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"it.system@albpetrol.al","password":"admin123"}' | grep connect.sid | awk '{print $7}')

if [ ! -z "$COOKIE" ]; then
    echo "Testing authenticated API call..."
    curl -s -X GET "https://legal.albpetrol.al/api/data-entries?page=1&limit=10&search=test" \
      -H "Accept: application/json" \
      -H "Cookie: connect.sid=$COOKIE" | jq '.pagination' || echo "Authenticated API failed"
else
    echo "Failed to get authentication cookie"
fi

echo "7. Checking frontend JavaScript for query structure..."
if [ -f "dist/public/assets/index-*.js" ]; then
    JS_FILE=$(ls dist/public/assets/index-*.js | head -1)
    echo "Checking query structure in: $JS_FILE"
    grep -o 'queryKey.*search.*sortOrder' "$JS_FILE" | head -3 || echo "No query structure found"
fi

echo "Debug complete!"