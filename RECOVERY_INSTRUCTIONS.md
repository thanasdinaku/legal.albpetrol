# 🚨 EMERGENCY RECOVERY INSTRUCTIONS

## Situation Summary
Your Ubuntu server database has been completely destroyed. This requires a full system restoration.

## What You'll Get Back
- ✅ Complete PostgreSQL database with proper schema
- ✅ All application tables and relationships  
- ✅ Essential user accounts for immediate access
- ✅ Fully functional legal case management system
- ✅ Working Albanian interface with date/time fields

## What Is Permanently Lost
- ❌ All existing user accounts (except defaults)
- ❌ All legal case data and entries
- ❌ All system settings and configurations
- ❌ Session data and login history

## RECOVERY STEPS

### 1. Copy Script to Ubuntu Server
On your Ubuntu server (10.5.20.31):

```bash
# Login as root
sudo -i

# Copy the restoration script (paste the content into a file)
nano ubuntu_complete_restoration.sh

# Make executable
chmod +x ubuntu_complete_restoration.sh
```

### 2. Run Complete Restoration
```bash
# Execute the restoration
./ubuntu_complete_restoration.sh
```

**Expected Duration:** 15-20 minutes

### 3. Monitor Progress
The script will:
- Stop all services safely
- Backup any remaining files
- Reinstall PostgreSQL completely
- Create fresh database and user
- Rebuild application from GitHub
- Create essential admin accounts
- Configure all services
- Start everything

### 4. Verify Success
After completion, test:
- https://legal.albpetrol.al (should load)
- Login with admin accounts
- Create test case entry
- Verify all functions work

## Default Accounts Created

| Email | Role | Purpose |
|-------|------|---------|
| admin@albpetrol.al | Admin | System Administrator |
| thanas.dinaku@albpetrol.al | Admin | Primary Admin User |
| enisa.cepele@albpetrol.al | User | Regular User |
| test@albpetrol.al | User | Testing Account |

## Post-Recovery Tasks

1. **Immediate Testing**
   - Login with admin accounts
   - Test case creation form
   - Verify Albanian interface works
   - Check date/time field functionality

2. **User Management**
   - Create additional user accounts
   - Assign appropriate roles
   - Set up email notifications

3. **Data Re-entry**
   - Begin entering legal cases
   - Import any backup data you have
   - Recreate system configurations

4. **Backup Setup**
   - Implement automated database backups
   - Create regular data exports
   - Document recovery procedures

## If Something Goes Wrong

If the script fails:
1. Check the error messages
2. Verify PostgreSQL is running: `systemctl status postgresql`
3. Check application logs: `journalctl -u albpetrol-legal -n 20`
4. Ensure all ports are accessible
5. Verify Cloudflare tunnel is active

## Important Notes
- This is a **complete rebuild** - no data recovery possible
- All previous configurations are lost
- Fresh admin accounts use email-based OIDC login
- The system will be production-ready after restoration
- Consider this a clean slate to improve the system

## Support
If you encounter issues during recovery, document the exact error messages and at which step the failure occurred.