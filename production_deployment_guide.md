# Production Deployment Guide - Filtering & Sorting Fix

## Issue
The filtering and sorting functionality works perfectly in development but not on production server at https://legal.albpetrol.al

## Root Cause
The production server has outdated code that doesn't match the working development environment.

## Step-by-Step Fix for Production Server

### Step 1: Connect to Production Server
```bash
ssh admuser@10.5.20.31
sudo su -
cd /opt/ceshtje_ligjore/ceshtje_ligjore
```

### Step 2: Backup Current Files
```bash
cp server/routes.ts server/routes.ts.old
cp client/src/components/case-table.tsx client/src/components/case-table.tsx.old
```

### Step 3: Apply Critical Backend Fix
Edit the file `server/routes.ts` and find line around 172:

**FIND THIS:**
```javascript
      res.json({
        entries,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
```

**REPLACE WITH:**
```javascript
      res.json({
        entries,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      });
```

### Step 4: Verify Frontend Has Debounced Search
Check that `client/src/components/case-table.tsx` contains:
- `useDebounced` function (around line 25)
- `debouncedSearchTerm` usage (around line 53)
- Proper queryKey with search and sort parameters (around line 56)

### Step 5: Build and Deploy
```bash
# Build the application
npm run build

# If build successful, restart service
systemctl restart albpetrol-legal

# Check service status
systemctl status albpetrol-legal --no-pager

# Test the application
curl -I https://legal.albpetrol.al
```

### Step 6: Verify Fix
1. Go to https://legal.albpetrol.al/data-table
2. Type in search box - should show filtered results
3. Click "Më të Rejat" and "Më të Vjetrat" - should reorder entries
4. Check browser console for any errors

## Alternative: Direct File Replacement

If editing is difficult, you can replace the entire files with working versions:

```bash
# Create the exact working backend response
cat > temp_routes_fix.txt << 'EOF'
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
EOF

# Apply the fix using sed
sed -i '/pagination: {/,/},/{
  /pagination: {/r temp_routes_fix.txt
  /pagination: {/,/},/d
}' server/routes.ts

rm temp_routes_fix.txt
```

## Verification Commands
```bash
# Check if the fix was applied
grep -A 6 "pagination: {" server/routes.ts

# Should show:
# pagination: {
#   currentPage: pageNum,
#   totalPages: Math.ceil(total / limitNum),
#   totalItems: total,
#   itemsPerPage: limitNum,
# },
```

## Emergency Restore
If anything goes wrong:
```bash
cp server/routes.ts.old server/routes.ts
npm run build
systemctl restart albpetrol-legal
```