# Direct Server Deployment - Copy & Paste Commands

## Option 1: Single Command Deployment

Copy and paste this entire command block on your Ubuntu server (admuser@10.5.20.31):

```bash
cd /opt/ceshtje_ligjore/ceshtje_ligjore && \
sudo cp -r . ../backup_$(date +%Y%m%d_%H%M%S) && \
sudo systemctl stop albpetrol-legal && \
echo "Service stopped, ready for file updates..." && \
echo "Update the following files now:" && \
echo "1. client/src/components/case-edit-form.tsx" && \
echo "2. client/src/components/DocumentUploader.tsx" && \
echo "Press Enter when files are updated..." && \
read && \
sudo chown -R admuser:admuser . && \
sudo chmod -R 755 client/src/components/ && \
sudo chmod -R 755 server/ && \
npm install --production && \
npm run build && \
sudo systemctl start albpetrol-legal && \
sleep 15 && \
sudo systemctl is-active albpetrol-legal && \
echo "Deployment completed - check https://legal.albpetrol.al"
```

## Option 2: Step by Step Commands

### Step 1: Connect and Prepare
```bash
ssh admuser@10.5.20.31
cd /opt/ceshtje_ligjore/ceshtje_ligjore
sudo cp -r . ../backup_$(date +%Y%m%d_%H%M%S)
sudo systemctl stop albpetrol-legal
```

### Step 2: Update Key Files
```bash
# Edit the most important file - case edit form
sudo nano client/src/components/case-edit-form.tsx
```

**Add these missing court session fields in the form JSX section:**
```tsx
{/* Court session fields - ADD THESE */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField
    control={form.control}
    name="zhvillimisSeancesShkalle1"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Zhvillimi i seances gjyqesorë data,ora (Shkallë I)</FormLabel>
        <FormControl>
          <Input {...field} data-testid="input-zhvillimis-seances-shkalle1" />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />

  <FormField
    control={form.control}
    name="zhvillimisSeancesApel"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Zhvillimi i seances gjyqesorë data,ora (Apel)</FormLabel>
        <FormControl>
          <Input {...field} data-testid="input-zhvillimis-seances-apel" />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>
```

**Change "Gjykata e Lartë" from Select to Input:**
Find the "Gjykata e Lartë" field and replace Select with Input:
```tsx
<FormField
  control={form.control}
  name="gjykataLarte"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Gjykata e Lartë</FormLabel>
      <FormControl>
        <Input {...field} data-testid="input-gjykata-larte" />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Add the missing fields to defaultValues:**
```tsx
defaultValues: {
  // ... existing fields ...
  zhvillimisSeancesShkalle1: caseData.zhvillimisSeancesShkalle1 || "",
  zhvillimisSeancesApel: caseData.zhvillimisSeancesApel || "",
  // ... rest of fields ...
},
```

### Step 3: Rebuild and Restart
```bash
sudo chown -R admuser:admuser .
sudo chmod -R 755 client/src/components/
sudo chmod -R 755 server/
npm install --production
npm run build
sudo systemctl start albpetrol-legal
```

### Step 4: Verify Deployment
```bash
sudo systemctl status albpetrol-legal
sudo systemctl is-active albpetrol-legal
sudo journalctl -u albpetrol-legal -f --no-pager
```

## Quick Test
1. Open: https://legal.albpetrol.al
2. Login: it.system@albpetrol.al / Admin2025!
3. Go to "Menaxho Çështjet" 
4. Edit any case
5. Check for:
   - Court session date/time fields (both levels)
   - "Gjykata e Lartë" as text input (not dropdown)
   - Document upload working

## Rollback if Needed
```bash
cd /opt/ceshtje_ligjore/ceshtje_ligjore
sudo systemctl stop albpetrol-legal
sudo cp -r ../backup_YYYYMMDD_HHMMSS/* .
sudo systemctl start albpetrol-legal
```