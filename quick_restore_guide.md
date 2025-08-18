# EMERGENCY DATABASE RESTORATION GUIDE

## What Was Lost
- **All user accounts** (except system defaults)
- **All case data** (legal entries)
- **All system settings** and configurations
- **Session data** and login history

## What Will Be Restored

### Database Structure
- ✅ All tables (users, data_entries, sessions, etc.)
- ✅ Complete schema with 19 Albanian legal case fields
- ✅ New date/time field for court sessions
- ✅ Proper indexes and relationships

### Default User Accounts
- `admin@albpetrol.al` - System Administrator
- `thanas.dinaku@albpetrol.al` - Admin User  
- `enisa.cepele@albpetrol.al` - Regular User

## How to Run the Recovery

```bash
# On your Ubuntu server (10.5.20.31)
cd /root
chmod +x emergency_database_restoration.sh
./emergency_database_restoration.sh
```

## After Recovery Steps

1. **Test Login**: Visit https://legal.albpetrol.al
2. **Verify Users**: Login with admin accounts
3. **Create Additional Users**: Use admin panel to add users
4. **Re-enter Data**: Start adding legal cases again
5. **Setup Backups**: Create automated backup system

## Recovery Time
- **Estimated duration**: 10-15 minutes
- **Downtime**: Application will be unavailable during recovery
- **Data loss**: All existing data will be permanently lost

## Important Notes
- This is a **complete rebuild** - no data can be recovered
- Make sure to run this on the Ubuntu server (10.5.20.31)
- The script will create fresh admin accounts for immediate access
- All case data must be re-entered manually after recovery