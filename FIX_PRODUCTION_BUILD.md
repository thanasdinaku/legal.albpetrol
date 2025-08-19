# Fix Production Build Issue

The build failed because `vite` is not available in production. Here's how to fix it:

## Quick Fix Commands

Copy and paste these commands on your server (you're already connected as root):

```bash
# Install all dependencies including dev dependencies
npm install

# Now build the application
npm run build

# Start the service
sudo systemctl start albpetrol-legal

# Wait and check status
sleep 15
sudo systemctl is-active albpetrol-legal
sudo systemctl status albpetrol-legal --no-pager

# Check if it's working
echo "Deployment completed - check https://legal.albpetrol.al"
```

## What Happened

The deployment script tried to run `npm install --production` which excludes development dependencies like `vite` that are needed for building. In production, you need to build first, then you can clean up dev dependencies if needed.

## Alternative Full Build Process

If you want to be more careful:

```bash
# Make sure we're in the right directory
cd /opt/ceshtje_ligjore/ceshtje_ligjore

# Install all dependencies (including dev dependencies for building)
npm install

# Build the application
npm run build

# Optional: Clean up dev dependencies after build
# npm install --production

# Set proper permissions
sudo chown -R admuser:admuser .

# Start the service
sudo systemctl start albpetrol-legal

# Verify it's running
sleep 15
sudo systemctl is-active albpetrol-legal

# Check logs for any errors
sudo journalctl -u albpetrol-legal --since "2 minutes ago" --no-pager

echo "Check your application at: https://legal.albpetrol.al"
```

## Important: File Updates

Remember, you still need to update these files with the improved versions:

1. **client/src/components/case-edit-form.tsx** - Add court session fields
2. **client/src/components/DocumentUploader.tsx** - Fix URL construction

The build will include whatever files are currently in place, so make sure to update them before or after the build step.

## Test After Deployment

1. Go to https://legal.albpetrol.al
2. Login: it.system@albpetrol.al / Admin2025!
3. Test case editing to see if court session fields are present
4. Test document upload functionality