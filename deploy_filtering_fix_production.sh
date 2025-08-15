#!/bin/bash
# Deploy the proven filtering fixes to production server

echo "🚀 Deploying filtering and sorting fixes to production..."

# Copy the working development fixes to production server
echo "Copying fixed case-table.tsx to production..."

# The key fixes that need to be applied to production:
# 1. Add limit parameter to query key
# 2. Set staleTime to 0 for fresh queries  
# 3. Add cache invalidation to search/sort handlers

# Apply fix 1: Add limit parameter
sed -i '/page: currentPage,/a \      limit: 10,' client/src/components/case-table.tsx

# Apply fix 2: Set staleTime to 0
sed -i 's/staleTime: 30000,/staleTime: 0, \/\/ Always fresh for search\/sort/' client/src/components/case-table.tsx
sed -i 's/gcTime: 5 \* 60 \* 1000,/gcTime: 1 \* 60 \* 1000, \/\/ 1 minute/' client/src/components/case-table.tsx

# Apply fix 3: Add cache invalidation to handlers
sed -i '/setSortOrder(order);/a \    \/\/ Force refresh by invalidating cache\n    queryClient.invalidateQueries({ queryKey: ["/api/data-entries"] });' client/src/components/case-table.tsx

sed -i '/setSearchTerm(value);/a \    \/\/ Force refresh by invalidating cache\n    queryClient.invalidateQueries({ queryKey: ["/api/data-entries"] });' client/src/components/case-table.tsx

echo "Building application with fixes..."
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
        echo "🎉 FILTERING AND SORTING FIXES DEPLOYED!"
        echo ""
        echo "📋 Applied fixes:"
        echo "   ✅ Added limit parameter to API queries"
        echo "   ✅ Disabled query caching for immediate results"
        echo "   ✅ Added cache invalidation on search/sort"
        echo ""
        echo "🔗 Test now: https://legal.albpetrol.al/data-table"
        echo "   - Search box should filter results immediately"
        echo "   - Sort buttons should reorder entries"
        echo ""
    else
        echo "❌ Service failed to start"
        systemctl status albpetrol-legal --no-pager
    fi
else
    echo "❌ Build failed"
fi