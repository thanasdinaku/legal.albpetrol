# Manual Deployment Guide - Today's Improvements

## Quick Manual Deployment Steps

Based on the deployment attempt, here's the simplified manual process:

### Step 1: Connect to Production Server
```bash
ssh admuser@10.5.20.31
cd /opt/ceshtje_ligjore/ceshtje_ligjore
```

### Step 2: Create Backup
```bash
sudo cp -r . ../backup_manual_$(date +%Y%m%d_%H%M%S)
```

### Step 3: Stop Service
```bash
sudo systemctl stop albpetrol-legal
```

### Step 4: Update the Key Files

Copy and paste the following improved files directly on the server:

#### A) Update Case Edit Form
```bash
sudo nano client/src/components/case-edit-form.tsx
```
**Replace the entire content with the improved version that includes:**
- Court session date/time fields for both levels
- Text input for "Gjykata e Lartë" instead of dropdown

#### B) Update Document Uploader
```bash
sudo nano client/src/components/DocumentUploader.tsx  
```
**Fix the URL construction in the onSuccess handler**

#### C) Update Server Routes (if needed)
```bash
sudo nano server/routes.ts
```
**Ensure proper file upload handling**

### Step 5: Rebuild and Restart
```bash
# Install dependencies
npm install --production

# Build application
npm run build

# Start service
sudo systemctl start albpetrol-legal

# Check status
sudo systemctl status albpetrol-legal
```

### Step 6: Verify Deployment
```bash
# Check service is running
sudo systemctl is-active albpetrol-legal

# Check logs for errors
sudo journalctl -u albpetrol-legal -f --no-pager

# Test API (optional)
curl -I http://localhost:5000/api/auth/user
```

## Specific Files to Update

### 1. Case Edit Form Improvements
File: `client/src/components/case-edit-form.tsx`

**Key additions needed:**
- Court session date/time fields (Shkallë I and Apel)
- Text input for Gjykata e Lartë instead of dropdown

### 2. Document Upload Fixes  
File: `client/src/components/DocumentUploader.tsx`

**Key fix needed:**
- URL construction in onSuccess handler
- Proper error handling for uploads

### 3. Verify Case Entry Form
File: `client/src/components/case-entry-form.tsx`

**Should already have:**
- All court session fields
- Document upload functionality

## Testing After Deployment

1. **Access Application**: https://legal.albpetrol.al
2. **Login**: it.system@albpetrol.al / Admin2025!
3. **Test Document Upload**:
   - Go to "Regjistro Çështje"
   - Try uploading a PDF/Word document
   - Verify no errors in browser console
4. **Test Case Editing**:
   - Go to "Menaxho Çështjet" 
   - Edit an existing case
   - Verify court session fields are present
   - Verify "Gjykata e Lartë" is text input

## Rollback if Issues
```bash
sudo systemctl stop albpetrol-legal
sudo rm -rf /opt/ceshtje_ligjore/ceshtje_ligjore
sudo cp -r /opt/ceshtje_ligjore/backup_manual_* /opt/ceshtje_ligjore/ceshtje_ligjore
sudo systemctl start albpetrol-legal
```

## Key Files Changed Today

- ✅ `client/src/components/case-edit-form.tsx` - Added missing court session fields
- ✅ `client/src/components/DocumentUploader.tsx` - Fixed URL construction errors  
- ✅ Form field parity between entry and edit forms
- ✅ Changed "Gjykata e Lartë" from dropdown to text input

The main improvements focus on:
1. Document upload system working without client-side errors
2. Complete court session fields in case edit form
3. Consistent field structure between entry and edit forms