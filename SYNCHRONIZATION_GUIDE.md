# 🔄 Replit ↔ Ubuntu Server Synchronization Guide

## Overview

This guide explains how to keep your Replit development environment synchronized with your Ubuntu production server at `10.5.20.29` (https://legal.albpetrol.al).

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌──────────────────┐
│                 │         │                 │         │                  │
│  Replit.com     │ ──────> │    GitHub       │ ──────> │  Ubuntu Server   │
│  Development    │  push   │   Repository    │  pull   │  Production      │
│                 │         │                 │         │  10.5.20.29      │
└─────────────────┘         └─────────────────┘         └──────────────────┘
```

**GitHub Repository**: `thanasdinaku/legal.albpetrol.git`

---

## 📋 Current State

### Replit Environment
- **URL**: https://replit.com/@truealbos/CaseRecord
- **Database**: PostgreSQL (Neon serverless)
- **Authentication**: Replit OIDC
- **Git Branch**: `main`

### Ubuntu Server
- **IP**: 10.5.20.29
- **URL**: https://legal.albpetrol.al
- **Path**: `/opt/ceshtje-ligjore`
- **Database**: PostgreSQL (local)
- **Web Server**: Nginx → Node.js (PM2)
- **Port**: 5000 (internal)

---

## 🚀 Quick Sync Methods

### Method 1: Automated Script (Easiest)

**On Replit:**
```bash
./sync-replit-to-ubuntu.sh
```

This script will:
1. Show current git status
2. Commit and push changes to GitHub
3. Optionally SSH to Ubuntu and deploy automatically

### Method 2: Manual Sync (Step by Step)

#### Step 1: Push from Replit
```bash
# In Replit Shell
git add .
git commit -m "Your descriptive message"
git push origin main
```

#### Step 2: Pull on Ubuntu Server
```bash
# SSH to Ubuntu server
ssh root@10.5.20.29

# Navigate to project
cd /opt/ceshtje-ligjore

# Backup current state (optional)
git stash

# Pull latest changes
git pull origin main

# Install new dependencies (if any)
npm install

# Rebuild application
npm run build

# Restart PM2
pm2 restart albpetrol-legal

# Verify
pm2 logs albpetrol-legal --lines 20
```

### Method 3: Compare First, Then Sync

**Check differences before syncing:**
```bash
# On Replit
./compare-environments.sh
```

This shows:
- Git commit differences
- File structure comparison
- Dependency versions
- Server status

---

## 🔍 How to Check if Environments are Synchronized

### Quick Check
```bash
# On Replit
git log -1 --oneline

# On Ubuntu Server
cd /opt/ceshtje-ligjore
git log -1 --oneline
```

**If outputs match → Environments are synced ✅**
**If different → Need to sync ⚠️**

### Detailed Comparison
Run the comparison script:
```bash
./compare-environments.sh
```

Look for:
- ✅ Same "Latest commit" hash
- ✅ Ubuntu has 0 uncommitted changes
- ✅ PM2 shows "online" status
- ✅ Same package.json version

---

## 🔧 Common Scenarios

### Scenario 1: You Made Changes on Replit
```bash
# 1. Commit and push from Replit
git add .
git commit -m "Fixed bug X"
git push origin main

# 2. Pull on Ubuntu
ssh root@10.5.20.29
cd /opt/ceshtje-ligjore
git pull origin main
npm run build
pm2 restart albpetrol-legal
```

### Scenario 2: Ubuntu Server Has Local Changes
```bash
# On Ubuntu - Save local changes first
git stash
git pull origin main
npm install
npm run build
pm2 restart albpetrol-legal

# If you need local changes back
git stash pop
```

### Scenario 3: Database Schema Changed
```bash
# On Replit - after schema changes in shared/schema.ts
npm run db:push

# On Ubuntu - after pulling changes
cd /opt/ceshtje-ligjore
npm run db:push
pm2 restart albpetrol-legal
```

### Scenario 4: New Dependencies Added
```bash
# On Ubuntu - after pulling package.json changes
npm install
npm run build
pm2 restart albpetrol-legal
```

---

## 🎯 Best Practices

### 1. **Always Use Git**
- ✅ DO: Commit changes with descriptive messages
- ❌ DON'T: Manually copy files between environments

### 2. **Test on Replit First**
- ✅ DO: Test features on Replit before deploying
- ❌ DON'T: Make untested changes directly on Ubuntu

### 3. **Backup Before Major Changes**
```bash
# On Ubuntu
cd /opt/ceshtje-ligjore
git stash  # Quick backup
# or
git branch backup-$(date +%Y%m%d)  # Named backup
```

### 4. **Check Logs After Deployment**
```bash
# On Ubuntu
pm2 logs albpetrol-legal --lines 50
```

### 5. **Database Migrations**
- Always run `npm run db:push` after schema changes
- Test migrations on Replit first
- Backup production database before major schema changes

---

## 🛠️ Troubleshooting

### Problem: "Git push failed - authentication required"
**Solution:**
```bash
# On Replit - set up GitHub authentication
git remote set-url origin https://<YOUR_GITHUB_TOKEN>@github.com/thanasdinaku/legal.albpetrol.git
```

### Problem: "Port 5000 already in use" on Ubuntu
**Solution:**
```bash
pm2 restart albpetrol-legal
# or
pm2 stop albpetrol-legal
pm2 start albpetrol-legal
```

### Problem: "Build fails on Ubuntu"
**Solution:**
```bash
# Clear node_modules and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problem: "Database connection error"
**Solution:**
```bash
# Check PostgreSQL status
systemctl status postgresql

# Restart if needed
systemctl restart postgresql
```

---

## 📊 File Comparison Checklist

**Before deploying, ensure these files are synced:**

Core Application:
- [ ] `server/routes.ts` - API endpoints
- [ ] `server/storage.ts` - Database operations
- [ ] `shared/schema.ts` - Database schema
- [ ] `client/src/` - Frontend components

Configuration:
- [ ] `package.json` - Dependencies
- [ ] `drizzle.config.ts` - Database config
- [ ] `ecosystem.config.cjs` - PM2 config

Environment:
- [ ] `.env` files (manually sync secrets)
- [ ] Database connection strings

---

## 🔐 Security Notes

1. **Never commit sensitive data**:
   - API keys
   - Database passwords
   - Email credentials

2. **Environment Variables**:
   - Replit: Use Secrets tab
   - Ubuntu: Use `.env` file (not in git)

3. **Database Backups**:
   - Replit: Automatic by Neon
   - Ubuntu: Set up `pg_dump` cron job

---

## 📞 Quick Reference Commands

### Replit
```bash
git status                    # Check changes
git add .                     # Stage all files
git commit -m "message"       # Commit
git push origin main          # Push to GitHub
./compare-environments.sh     # Compare with Ubuntu
./sync-replit-to-ubuntu.sh   # Auto-sync
```

### Ubuntu Server
```bash
ssh root@10.5.20.29          # Connect
cd /opt/ceshtje-ligjore      # Navigate to project
git pull origin main         # Pull latest
npm install                  # Install dependencies
npm run build                # Build
pm2 restart albpetrol-legal  # Restart app
pm2 logs albpetrol-legal     # View logs
pm2 list                     # Check status
```

---

## ✅ Deployment Checklist

Before deploying to Ubuntu:

1. [ ] All changes committed on Replit
2. [ ] Code builds successfully on Replit
3. [ ] Tests pass (if applicable)
4. [ ] Database schema updated (if changed)
5. [ ] Environment variables configured
6. [ ] Pushed to GitHub
7. [ ] Pulled on Ubuntu
8. [ ] Dependencies installed on Ubuntu
9. [ ] Application rebuilt on Ubuntu
10. [ ] PM2 restarted
11. [ ] Logs checked for errors
12. [ ] Website accessible at https://legal.albpetrol.al

---

## 🎉 Success Indicators

Your environments are properly synced when:

✅ Same git commit hash on both
✅ Same file structure and content
✅ Same package versions
✅ PM2 shows "online" status
✅ Website responds correctly
✅ No errors in PM2 logs
✅ Database queries work
✅ Email notifications send

---

**Last Updated**: October 8, 2025
**Maintained by**: Albpetrol IT System Team
