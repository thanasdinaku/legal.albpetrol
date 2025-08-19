# Emergency Fix for Build Error

## Problem
The build failed because `case-entry-form.tsx` has corrupted content at the top of the file.

## Quick Fix Commands

Copy and paste these commands on your server (you're already connected as root):

```bash
# First, let's see what's wrong with the file
head -5 client/src/components/case-entry-form.tsx

# The file likely has "[Complete component code as shown above]" at the top
# We need to fix this file immediately

# Create a backup of the corrupted file
cp client/src/components/case-entry-form.tsx client/src/components/case-entry-form.tsx.corrupted

# Replace the first line with proper import statement
sed -i '1s/.*/import { useState } from "react";/' client/src/components/case-entry-form.tsx

# If that doesn't work, we need to recreate the file
# Remove the corrupted first line completely
sed -i '1d' client/src/components/case-entry-form.tsx

# Add proper React import at the beginning
sed -i '1i import { useState } from "react";' client/src/components/case-entry-form.tsx

# Now try building again
npm run build

# If build succeeds, restart the service (it should already be running)
sudo systemctl restart albpetrol-legal

# Check status
sudo systemctl status albpetrol-legal --no-pager

echo "Fix applied - check https://legal.albpetrol.al"
```

## Alternative: Manual File Fix

If the automated fix doesn't work, edit the file manually:

```bash
nano client/src/components/case-entry-form.tsx
```

**Remove this line from the top:**
```
[Complete component code as shown above]
```

**Make sure the file starts with:**
```tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
// ... rest of imports
```

## Check Current Status

The service is actually running (I can see it's active), but it's probably running the old built version. Once we fix the file and rebuild, the new version will be deployed.

```bash
# Check current service status
sudo systemctl status albpetrol-legal --no-pager

# Check if the website is accessible
curl -I https://legal.albpetrol.al
```