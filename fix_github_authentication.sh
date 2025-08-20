#!/bin/bash

echo "🔧 Fixing GitHub Authentication on Ubuntu Server"
echo "==============================================="

# Step 1: Configure Git identity
echo "📝 Step 1: Configuring Git identity..."
git config --global user.name "Thanas Dinaku"
git config --global user.email "thanas.dinaku@albpetrol.al"

# Verify configuration
echo "Git configuration:"
git config --global user.name
git config --global user.email

echo ""
echo "📋 Step 2: GitHub Personal Access Token Setup"
echo "============================================="
echo ""
echo "⚠️  IMPORTANT: GitHub no longer accepts passwords for Git operations."
echo "You need a Personal Access Token (PAT) instead."
echo ""
echo "🔑 To create a Personal Access Token:"
echo ""
echo "1. Go to GitHub.com and login"
echo "2. Click your profile picture → Settings"
echo "3. Scroll down and click 'Developer settings'"
echo "4. Click 'Personal access tokens' → 'Tokens (classic)'"
echo "5. Click 'Generate new token' → 'Generate new token (classic)'"
echo "6. Give it a name: 'Albpetrol Legal System'"
echo "7. Select these scopes:"
echo "   ✅ repo (Full control of private repositories)"
echo "   ✅ workflow (Update GitHub Action workflows)"
echo "8. Click 'Generate token'"
echo "9. COPY THE TOKEN IMMEDIATELY (you won't see it again!)"
echo ""
echo "💾 Then run: ./configure_git_token.sh"
echo ""

# Create token configuration script
cat > configure_git_token.sh << 'TOKEN_SCRIPT'
#!/bin/bash

echo "🔑 Configuring GitHub Personal Access Token"
echo "=========================================="

read -p "Enter your GitHub username (thanasdinaku): " GITHUB_USER
GITHUB_USER=${GITHUB_USER:-thanasdinaku}

echo ""
echo "⚠️  Paste your Personal Access Token (it won't be visible):"
read -s GITHUB_TOKEN

# Configure Git to use token
git remote set-url origin https://$GITHUB_USER:$GITHUB_TOKEN@github.com/thanasdinaku/ceshtje_ligjore.git

echo ""
echo "✅ Testing connection..."
if git ls-remote origin &> /dev/null; then
    echo "✅ GitHub authentication successful!"
    
    # Now we can push
    echo "🚀 Pushing any pending changes..."
    git add .
    
    if git diff --staged --quiet; then
        echo "No changes to commit"
    else
        git commit -m "feat: configure git authentication for deployment"
        git push origin main
        echo "✅ Changes pushed successfully!"
    fi
else
    echo "❌ Authentication failed. Please check your token and try again."
    exit 1
fi

echo ""
echo "🔄 You can now use normal git commands:"
echo "   git add ."
echo "   git commit -m 'your message'"
echo "   git push origin main"
TOKEN_SCRIPT

chmod +x configure_git_token.sh

echo ""
echo "✅ Git identity configured!"
echo "🔑 Next: Create your Personal Access Token and run:"
echo "   ./configure_git_token.sh"