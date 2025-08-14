# Manual Fix for Ubuntu Server - JSON Parsing Errors

## Quick Fix Commands

Copy and paste these commands one by one in your Ubuntu server terminal:

```bash
# 1. Connect to your server
ssh root@10.5.20.31

# 2. Navigate to application directory
cd /opt/ceshtje_ligjore/ceshtje_ligjore

# 3. Stop the service
sudo systemctl stop albpetrol-legal

# 4. Create backup
sudo cp -r client/ client_backup_$(date +%Y%m%d_%H%M%S)

# 5. Download and run the fix script
wget https://raw.githubusercontent.com/thanasdinaku/ceshtje_ligjore/main/ubuntu_fix_script.sh
chmod +x ubuntu_fix_script.sh
sudo ./ubuntu_fix_script.sh
```

## Alternative: Manual File Editing

If the script doesn't work, edit files manually:

### Fix 1: Update queryClient.ts

```bash
sudo nano client/src/lib/queryClient.ts
```

Replace the `throwIfResNotOk` function with:

```javascript
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to parse as JSON first (for API errors)
      const errorResponse = await res.json();
      const message = errorResponse.message || errorResponse.error || res.statusText;
      throw new Error(`${res.status}: ${message}`);
    } catch (parseError) {
      // If JSON parsing fails, try to get text
      try {
        const text = await res.text() || res.statusText;
        // If it's HTML content, extract a more meaningful message
        if (text.includes('<!DOCTYPE')) {
          throw new Error(`${res.status}: Server error - please try again`);
        }
        throw new Error(`${res.status}: ${text}`);
      } catch (textError) {
        // Final fallback
        throw new Error(`${res.status}: ${res.statusText || 'Unknown error'}`);
      }
    }
  }
}
```

### Fix 2: Update case-entry-form.tsx

```bash
sudo nano client/src/components/case-entry-form.tsx
```

Find the `onError` section in `createMutation` and replace with:

```javascript
onError: (error) => {
  console.error('Data entry submission error:', error);
  
  // Handle authentication errors specifically
  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    toast({
      title: "Sesioni ka skaduar",
      description: "Ju lutem kyçuni përsëri në sistem",
      variant: "destructive",
    });
    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = "/auth";
    }, 2000);
  } else {
    toast({
      title: "Gabim në shtimin e çështjes",
      description: error.message || "Ndodhi një gabim gjatë regjistrimit të çështjes",
      variant: "destructive",
    });
  }
},
```

### Final Steps

```bash
# Rebuild application
npm run build

# Start service
sudo systemctl start albpetrol-legal

# Check status
sudo systemctl status albpetrol-legal

# Test
curl -I http://10.5.20.31:5000
```

## Test the Fix

1. Access **https://legal.albpetrol.al**
2. Log in as administrator
3. Try creating a new user in "Menaxhimi i Përdoruesve"
4. Try creating a new case in "Shtimi i Çështjes"

Both should work without JSON parsing errors now.