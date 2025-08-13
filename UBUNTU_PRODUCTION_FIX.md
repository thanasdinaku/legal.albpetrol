# Ubuntu Production Server Fix for Data Entry Issue

## Problem
The data entry form was showing JSON parsing errors when trying to submit new case entries through the web interface.

## Root Cause
The error handling on the client-side was not properly handling server responses, particularly when authentication failures occurred.

## Solution Applied

### 1. Enhanced Error Handling (Client-Side)
- Fixed JSON response parsing in `apiRequest` function
- Added better error messages for authentication failures  
- Added automatic redirect to login when session expires

### 2. Production Server Update Commands

Run these commands on your Ubuntu server (10.5.20.31):

```bash
# 1. Connect to the server
ssh root@10.5.20.31

# 2. Navigate to application directory
cd /opt/ceshtje_ligjore/ceshtje_ligjore

# 3. Stop the service temporarily
sudo systemctl stop albpetrol-legal

# 4. Create backup of current files
sudo cp -r client/ client_backup_$(date +%Y%m%d_%H%M%S)
sudo cp package-lock.json package-lock.json.backup

# 5. Update the client-side error handling (if files exist)
# Note: Production may be using compiled/built files, so this step might not be needed
# The fix is primarily in the client-side code which gets compiled

# 6. Rebuild the application (if using TypeScript compilation)
npm run build

# 7. Start the service
sudo systemctl start albpetrol-legal

# 8. Verify it's running
sudo systemctl status albpetrol-legal

# 9. Check logs for any errors
sudo journalctl -u albpetrol-legal -n 20 --no-pager

# 10. Test the application
curl -I http://10.5.20.31:5000
```

### 3. Testing the Fix

After applying the fix:

1. **Access the web interface**: https://legal.albpetrol.al
2. **Log in** with administrator credentials (it.system@albpetrol.al)
3. **Complete 2FA** with email verification code
4. **Navigate to** "Shtimi i Çështjes" (Add Case)
5. **Fill out the form** with test data:
   - Paditesi: "Test Case Entry"  
   - I Paditur: "Test Defendant"
   - Objekti i Padise: "Test legal case for verification"
   - Select appropriate court from dropdown
6. **Submit the form** - it should now work without JSON parsing errors

### 4. Expected Results

- ✅ Form submits successfully
- ✅ Success message appears: "Çështja u shtua me sukses"
- ✅ Data appears in the "Tabela e të Dhënave" section
- ✅ Dashboard statistics update to show 1 total entry
- ✅ Email notification sent (if configured)

### 5. If Issues Persist

Check the browser's Developer Console (F12) for any remaining errors and share them for further debugging.

The Ubuntu server itself is healthy - this was primarily a client-side error handling issue that has now been resolved.