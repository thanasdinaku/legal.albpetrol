# Server Build Fix - ilike Function Error

## Problem
The server build is failing because of an `ilike` function error in `server/storage.ts` line 421.

## Quick Fix Commands

Copy and paste these commands on your server:

```bash
# First, let's see the exact error in context
sed -n '415,425p' server/storage.ts

# The issue is likely missing import for 'ilike' from drizzle-orm
# Let's check the imports at the top of the file
head -20 server/storage.ts | grep -E "import|from"

# Fix the import - add ilike to the drizzle-orm import
sed -i 's/import { eq, and, or, desc, asc }/import { eq, and, or, desc, asc, ilike }/' server/storage.ts

# If that doesn't work, try this alternative fix
sed -i 's/from "drizzle-orm"/from "drizzle-orm"\nimport { ilike } from "drizzle-orm";/' server/storage.ts

# Or manually add the import after the existing drizzle-orm imports
sed -i '/from "drizzle-orm"/a import { ilike } from "drizzle-orm";' server/storage.ts

# Now build again
npm run build

# If successful, restart the service
sudo systemctl restart albpetrol-legal

# Check status
sudo systemctl status albpetrol-legal --no-pager

echo "Application should be working at https://legal.albpetrol.al"
```

## Alternative Manual Fix

If the automated fix doesn't work:

```bash
# Edit the file manually
nano server/storage.ts

# Look for the imports section at the top and add ilike:
# Change this line:
# import { eq, and, or, desc, asc } from "drizzle-orm";
# To this:
# import { eq, and, or, desc, asc, ilike } from "drizzle-orm";
```

## Complete Fix Process

```bash
# 1. Fix the ilike import
sed -i 's/import { eq, and, or, desc, asc }/import { eq, and, or, desc, asc, ilike }/' server/storage.ts

# 2. Build the application
npm run build

# 3. Restart service
sudo systemctl restart albpetrol-legal

# 4. Wait for startup
sleep 10

# 5. Check status
sudo systemctl status albpetrol-legal --no-pager

# 6. Test the application
curl -I http://localhost:5000/api/auth/user

echo "Deployment should now be complete!"
echo "Check your application at: https://legal.albpetrol.al"
```

## What This Fixes

The `ilike` function is used for case-insensitive LIKE queries in PostgreSQL via Drizzle ORM. It needs to be imported from the `drizzle-orm` package to be used in the storage file.

Once this is fixed, both frontend and backend will build successfully, and your application will be fully deployed with today's improvements.