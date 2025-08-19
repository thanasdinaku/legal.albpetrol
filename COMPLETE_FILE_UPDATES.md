# Complete File Updates for Production Deployment

## Files to Update on Production Server

### 1. Case Edit Form (MOST IMPORTANT)
**File**: `client/src/components/case-edit-form.tsx`

**Key Changes:**
- Added missing court session date/time fields
- Changed "Gjykata e Lartë" from dropdown to text input
- Fixed form field consistency

### 2. Document Uploader
**File**: `client/src/components/DocumentUploader.tsx`

**Key Changes:**
- Fixed URL construction in onSuccess handler
- Improved error handling

### 3. Case Entry Form (Verify Consistency)
**File**: `client/src/components/case-entry-form.tsx`

**Key Changes:**
- Ensure all fields match edit form
- Document upload integration

## Deployment Steps

### Step 1: Connect to Server
```bash
ssh admuser@10.5.20.31
cd /opt/ceshtje_ligjore/ceshtje_ligjore
```

### Step 2: Run Deployment Script
```bash
# Download and run the deployment script
curl -o deploy.sh https://your-replit-url/SERVER_DEPLOYMENT_COMMANDS.sh
chmod +x deploy.sh
./deploy.sh
```

### Step 3: Update Files Manually
When the script pauses, you need to update these files with the improved versions:

#### Method A: Direct Edit
```bash
sudo nano client/src/components/case-edit-form.tsx
sudo nano client/src/components/DocumentUploader.tsx
```

#### Method B: Replace Content
Copy the complete file content from your development and paste it in the production files.

### Step 4: Continue Script
Press Enter to continue the deployment script after updating files.

## Key Improvements Being Deployed

1. **Court Session Fields Added to Edit Form:**
   - Zhvillimi i seances gjyqesorë data,ora (Shkallë I)
   - Zhvillimi i seances gjyqesorë data,ora (Apel)

2. **Gjykata e Lartë Field:**
   - Changed from Select dropdown to Text input
   - Allows free text entry

3. **Document Upload Fixes:**
   - Fixed URL construction errors
   - Improved error handling
   - Better file processing

4. **Form Field Parity:**
   - Entry and edit forms now have identical fields
   - Consistent user experience

## Testing After Deployment

1. **Access**: https://legal.albpetrol.al
2. **Login**: it.system@albpetrol.al / Admin2025!
3. **Test Document Upload**:
   - Go to "Regjistro Çështje"
   - Upload PDF/Word files
   - Verify no console errors
4. **Test Case Editing**:
   - Go to "Menaxho Çështjet"
   - Edit existing case
   - Verify all court session fields present
   - Verify "Gjykata e Lartë" is text input

## Rollback if Needed

If something goes wrong:
```bash
cd /opt/ceshtje_ligjore/ceshtje_ligjore
sudo systemctl stop albpetrol-legal
sudo cp -r ../backup_YYYYMMDD_HHMMSS/* .
sudo systemctl start albpetrol-legal
```