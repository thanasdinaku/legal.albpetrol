# Complete Git Setup and Deployment Guide for Albpetrol Legal System

## Step 1: Version Control - Track All Changes and Rollback

### A. Initialize Git Repository (if not already done)
```bash
# In your Replit terminal or local development environment
git init
git add .
git commit -m "Initial commit: Albpetrol Legal System"
```

### B. Connect to GitHub Repository
```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/thanasdinaku/ceshtje_ligjore.git

# Push your code to GitHub
git branch -M main
git push -u origin main
```

### C. Track Changes with Meaningful Commits
```bash
# After making changes to your code
git add .
git commit -m "feat: add 2FA authentication system"
git push origin main

# For bug fixes
git commit -m "fix: resolve email sending issue with it.system@albpetrol.al"

# For updates
git commit -m "update: improve dashboard performance"
```

### D. Rollback if Needed
```bash
# View commit history
git log --oneline

# Rollback to specific commit
git reset --hard <commit-hash>
git push --force origin main

# Create a new branch for experimental features
git checkout -b feature/new-feature
git push origin feature/new-feature
```

## Step 2: Easy Updates - Just Git Pull for Latest Version

### A. On Ubuntu Server - Update Script
```bash
#!/bin/bash
# save as /opt/ceshtje-ligjore/update.sh

echo "Updating Albpetrol Legal System..."

# Stop application
pm2 stop albpetrol-legal

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild application
npm run build

# Update database schema if needed
npx drizzle-kit push

# Restart application
pm2 restart albpetrol-legal

echo "Update completed successfully!"
pm2 status
```

### B. Make Update Script Executable
```bash
chmod +x /opt/ceshtje-ligjore/update.sh

# To update in the future, just run:
sudo /opt/ceshtje-ligjore/update.sh
```

## Step 3: Consistent Deployments - Same Code Everywhere

### A. Environment Configuration Template
```bash
# Create .env.template in your repository
cat > .env.template << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
SESSION_SECRET=your_session_secret_here
REPL_ID=your_repl_id
REPLIT_DOMAINS=your_domains_here
ISSUER_URL=https://replit.com/oidc

# Email Configuration
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=it.system@albpetrol.al
SMTP_PASS=your_email_password
EMAIL_FROM=it.system@albpetrol.al
EOF

# Add to git
git add .env.template
git commit -m "add: environment configuration template"
git push origin main
```

### B. Deployment Script in Repository
```bash
# Create deploy.sh in your repository root
cat > deploy.sh << 'EOF'
#!/bin/bash

echo "Deploying Albpetrol Legal System..."

# Install dependencies
npm install

# Build application
npm run build

# Setup environment if not exists
if [ ! -f .env ]; then
    echo "Creating .env from template..."
    cp .env.template .env
    echo "Please edit .env file with your specific configuration"
fi

# Setup database
npx drizzle-kit push

# Start with PM2
pm2 start ecosystem.config.cjs

echo "Deployment completed!"
EOF

git add deploy.sh
git commit -m "add: deployment script"
git push origin main
```

## Step 4: Collaboration - Multiple Developers Can Contribute

### A. Branch Protection and Workflow
```bash
# Create development branch
git checkout -b develop
git push origin develop

# For new features
git checkout -b feature/user-management
# Make changes
git add .
git commit -m "feat: add user role management"
git push origin feature/user-management

# Create pull request on GitHub to merge into develop
```

### B. Code Review Process
1. **Create Pull Request** on GitHub
2. **Review Code** - Check for quality and security
3. **Test Branch** - Deploy to staging environment
4. **Merge to Main** - After approval
5. **Deploy to Production** - Automatically or manually

### C. Team Member Setup
```bash
# New team member clones repository
git clone https://github.com/thanasdinaku/ceshtje_ligjore.git
cd ceshtje_ligjore

# Install dependencies
npm install

# Copy environment template
cp .env.template .env
# Edit .env with development settings

# Start development server
npm run dev
```

## Step 5: Backup - Code Safely Stored on GitHub

### A. Multiple Backup Strategies
```bash
# 1. Regular pushes to GitHub
git push origin main

# 2. Create tags for releases
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 3. Create additional remotes for backup
git remote add backup https://github.com/backup-account/ceshtje_ligjore.git
git push backup main
```

### B. Automated Backup Script
```bash
#!/bin/bash
# save as backup.sh

echo "Creating backup..."

# Commit any changes
git add .
git commit -m "auto-backup: $(date)"

# Push to main repository
git push origin main

# Create timestamped tag
TAG="backup-$(date +%Y%m%d-%H%M%S)"
git tag $TAG
git push origin $TAG

echo "Backup completed: $TAG"
```

## Complete Ubuntu Server Setup

### Initial Deployment from Git
```bash
# 1. Clone repository
cd /opt
git clone https://github.com/thanasdinaku/ceshtje_ligjore.git ceshtje-ligjore
cd ceshtje-ligjore

# 2. Setup environment
cp .env.template .env
# Edit .env with production settings

# 3. Install and build
npm install
npm run build

# 4. Setup database
npx drizzle-kit push

# 5. Start application
pm2 start ecosystem.config.cjs
pm2 save
```

### Ongoing Updates
```bash
# Simple update process
cd /opt/ceshtje-ligjore
./update.sh
```

## GitHub Repository Features to Enable

1. **Branch Protection Rules**
   - Require pull request reviews
   - Require status checks before merging
   - Restrict pushes to main branch

2. **Actions/Workflows** (optional)
   - Automated testing on pull requests
   - Automated deployment to staging
   - Security scanning

3. **Issues and Project Management**
   - Track bugs and feature requests
   - Assign tasks to team members
   - Monitor progress

This setup gives you complete version control, easy deployments, team collaboration, and reliable backups for your Albpetrol Legal System.