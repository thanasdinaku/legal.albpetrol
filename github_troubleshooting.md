# GitHub Authentication Troubleshooting Guide

## Problem: "Password authentication is not supported"

GitHub disabled password authentication for Git operations on August 13, 2021. You must use a Personal Access Token (PAT) instead.

## Solution Steps

### Step 1: Configure Git Identity (On Ubuntu Server)
```bash
cd /opt/ceshtje-ligjore
git config --global user.name "Thanas Dinaku"
git config --global user.email "thanas.dinaku@albpetrol.al"
```

### Step 2: Create Personal Access Token

1. **Go to GitHub.com** and login to your account
2. **Click your profile picture** → **Settings**
3. **Scroll down** and click **"Developer settings"**
4. **Click "Personal access tokens"** → **"Tokens (classic)"**
5. **Click "Generate new token"** → **"Generate new token (classic)"**
6. **Fill out the form:**
   - **Note:** "Albpetrol Legal System Deployment"
   - **Expiration:** 90 days (or custom)
   - **Select scopes:**
     - ✅ **repo** (Full control of private repositories)
     - ✅ **workflow** (Update GitHub Action workflows)
7. **Click "Generate token"**
8. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

### Step 3: Configure Token (On Ubuntu Server)
```bash
# Replace YOUR_TOKEN with the actual token you copied
git remote set-url origin https://thanasdinaku:YOUR_TOKEN@github.com/thanasdinaku/ceshtje_ligjore.git

# Test the connection
git ls-remote origin
```

### Step 4: Alternative - Use SSH Keys (More Secure)

If you prefer SSH authentication:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "thanas.dinaku@albpetrol.al"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add this key to GitHub:
# GitHub → Settings → SSH and GPG keys → New SSH key

# Change remote to SSH
git remote set-url origin git@github.com:thanasdinaku/ceshtje_ligjore.git
```

## Quick Fix Commands

Run these commands on your Ubuntu server:

```bash
# Fix authentication immediately
cd /opt/ceshtje-ligjore

# Configure identity
git config --global user.name "Thanas Dinaku"
git config --global user.email "thanas.dinaku@albpetrol.al"

# Update remote with token (replace YOUR_TOKEN)
git remote set-url origin https://thanasdinaku:YOUR_TOKEN@github.com/thanasdinaku/ceshtje_ligjore.git

# Test and push
git add .
git commit -m "fix: configure git authentication"
git push origin main
```

## Security Best Practices

1. **Use tokens with minimal required scopes**
2. **Set expiration dates** for tokens
3. **Regenerate tokens periodically**
4. **Never commit tokens to code**
5. **Consider using SSH keys** for better security

## Token Management

- **Store tokens securely** - don't write them down in plain text
- **Use environment variables** for automated scripts
- **Revoke unused tokens** regularly from GitHub settings

## Common Errors and Solutions

### Error: "remote: Invalid username or token"
- **Solution:** Token is expired or incorrect. Generate a new one.

### Error: "Permission denied (publickey)"
- **Solution:** SSH key not configured. Use HTTPS with token instead.

### Error: "fatal: unable to auto-detect email address"
- **Solution:** Run `git config --global user.email "your@email.com"`

This fixes the authentication issue and enables proper Git workflows for your deployment.