#!/bin/bash
# Sync all production changes to GitHub repository

echo "🔄 Syncing production changes to GitHub..."

cd /opt/ceshtje_ligjore/ceshtje_ligjore

echo "=== STEP 1: CONFIGURE GIT ==="
# Set up git configuration if not already done
git config --global user.name "Production Server"
git config --global user.email "it.system@albpetrol.al"

echo "=== STEP 2: CHECK CURRENT STATUS ==="
echo "Current git status:"
git status

echo ""
echo "=== STEP 3: ADD ALL CHANGES ==="
# Add all modified and new files
git add .

echo "Files to be committed:"
git status --porcelain

echo ""
echo "=== STEP 4: CREATE COMPREHENSIVE COMMIT ==="
# Create a detailed commit message with all the fixes
git commit -m "Production fixes and enhancements - August 15, 2025

✅ Critical fixes implemented:
- Fixed filtering and sorting functionality (pagination response structure)
- Resolved Edit button production issue (replaced case-table.tsx component)
- Completed user management cleanup (removed thanas.dinaku@albpetrol.al)
- Fixed syntax errors in server/routes.ts (duplicate closing braces)
- Added manual page functionality with markdown content display

✅ Production deployment features:
- Ubuntu 24.04.3 LTS deployment guide
- Cloudflare Argo Tunnel configuration (legal.albpetrol.al)
- SSL certificate setup with Nginx
- systemd service configuration for albpetrol-legal
- Security hardening with CSP and HSTS headers

✅ Database improvements:
- Single root administrator configuration (it.system@albpetrol.al)
- Foreign key constraint handling during user cleanup
- Real-time database statistics from PostgreSQL system functions

✅ Manual and documentation:
- Comprehensive Albanian user manual (MANUAL_PERDORUESI_DETAJUAR.md)
- Production deployment guides and security analysis
- Troubleshooting scripts and emergency commands

✅ System configuration:
- Complete Ubuntu configuration collection scripts
- Production fix scripts and debugging tools
- Automated deployment and maintenance procedures

All production systems tested and verified working at:
- Local: https://10.5.20.31
- Public: https://legal.albpetrol.al
- Administrator: it.system@albpetrol.al / admin123"

echo ""
echo "=== STEP 5: PUSH TO GITHUB ==="
echo "Pushing to origin main branch..."

# Check if we have a remote origin configured
if git remote get-url origin >/dev/null 2>&1; then
    echo "Remote origin found: $(git remote get-url origin)"
    
    # Push to main branch
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pushed to GitHub!"
        echo ""
        echo "🎉 ALL PRODUCTION CHANGES SYNCED TO GITHUB!"
        echo ""
        echo "📋 Summary of what was pushed:"
        echo "• Fixed filtering/sorting backend API responses"
        echo "• Resolved Edit button dialog opening issues"
        echo "• Cleaned up user management (single admin)"
        echo "• Added manual page with markdown content"
        echo "• Production deployment scripts and guides"
        echo "• Security hardening and SSL configuration"
        echo "• Complete Ubuntu 24.04.3 LTS setup"
        echo "• Cloudflare tunnel configuration"
        echo ""
        echo "🔗 Repository: https://github.com/thanasdinaku/ceshtje_ligjore.git"
        echo "🌍 Live production: https://legal.albpetrol.al"
    else
        echo "❌ Failed to push to GitHub"
        echo "This might be due to authentication or network issues"
        echo ""
        echo "Alternative options:"
        echo "1. Set up SSH key authentication"
        echo "2. Use personal access token"
        echo "3. Check network connectivity"
    fi
else
    echo "❌ No remote origin configured"
    echo ""
    echo "Setting up GitHub remote..."
    git remote add origin https://github.com/thanasdinaku/ceshtje_ligjore.git
    
    echo "Now attempting to push..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully configured and pushed to GitHub!"
    else
        echo "❌ Authentication required"
        echo ""
        echo "To complete the sync, you'll need to:"
        echo "1. Generate a GitHub Personal Access Token"
        echo "2. Use: git push https://USERNAME:TOKEN@github.com/thanasdinaku/ceshtje_ligjore.git"
        echo "3. Or set up SSH keys for authentication"
    fi
fi

echo ""
echo "=== STEP 6: VERIFY SYNC ==="
echo "Latest commit:"
git log --oneline -1

echo ""
echo "Repository status:"
git status

echo ""
echo "=== SYNC PROCESS COMPLETE ==="