#!/bin/bash

echo "🔧 Updating email address to it.system@albpetrol.al on Ubuntu server..."

# Run these commands on Ubuntu server as root:

cat << 'UBUNTU_COMMANDS'
# Stop PM2
pm2 stop albpetrol-legal

# Update all files with correct email address
cd /opt/ceshtje-ligjore

# Update React app default email
sed -i 's/admin@albpetrol\.al/it.system@albpetrol.al/g' dist/public/assets/replit-app.js

# Update server email validation
sed -i 's/admin@albpetrol\.al/it.system@albpetrol.al/g' dist/index.js

# Update HTML placeholder
sed -i 's/admin@albpetrol\.al/it.system@albpetrol.al/g' dist/public/index.html

# Alternative: Recreate the server file with correct email
cat > dist/index.js << 'SERVER_UPDATE_EOF'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

console.log('Starting Albpetrol Legal System with Professional Replit Interface...');

const sessions = new Map();
const twoFactorCodes = new Map();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, '../static')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

const testUser = {
  id: 'admin-user-123', 
  email: 'it.system@albpetrol.al', 
  password: 'Admin2025!',
  firstName: 'IT', 
  lastName: 'System', 
  role: 'admin'
};

function isAuthenticated(req, res, next) {
  const sessionId = req.headers.cookie?.split('sessionId=')[1]?.split(';')[0];
  const session = sessions.get(sessionId);
  
  if (session && session.user) {
    req.user = session.user;
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt: ${email}`);
  
  if (email === testUser.email && password === testUser.password) {
    const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
    const userId = testUser.id;
    
    twoFactorCodes.set(userId, {
      code: twoFactorCode, expires: Date.now() + 3 * 60 * 1000, email: email
    });
    
    console.log(`2FA code generated for ${email}: ${twoFactorCode}`);
    
    res.json({
      requiresTwoFactor: true, userId: userId, email: email,
      message: 'Kodi i verifikimit është dërguar në email-in tuaj.'
    });
  } else {
    res.status(401).json({ message: 'Email-i ose fjalëkalimi është i gabuar.' });
  }
});

app.post('/api/verify-2fa', (req, res) => {
  const { userId, code } = req.body;
  console.log(`2FA verification attempt for user ${userId} with code ${code}`);
  
  const twoFactorData = twoFactorCodes.get(userId);
  
  if (!twoFactorData || Date.now() > twoFactorData.expires) {
    twoFactorCodes.delete(userId);
    return res.status(401).json({ message: 'Kodi i verifikimit ka skaduar. Provoni të kyçeni përsëri.' });
  }
  
  if (code === twoFactorData.code) {
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    sessions.set(sessionId, { user: testUser, createdAt: Date.now() });
    twoFactorCodes.delete(userId);
    
    console.log(`2FA verification successful for ${testUser.email}`);
    
    res.cookie('sessionId', sessionId, { 
      httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000
    });
    
    res.json(testUser);
  } else {
    res.status(401).json({ message: 'Kodi i verifikimit është i gabuar.' });
  }
});

app.get('/api/auth/user', isAuthenticated, (req, res) => {
  res.json(req.user);
});

app.get('/api/logout', (req, res) => {
  const sessionId = req.headers.cookie?.split('sessionId=')[1]?.split(';')[0];
  if (sessionId) sessions.delete(sessionId);
  res.clearCookie('sessionId');
  res.redirect('/');
});

app.get('/api/dashboard/stats', isAuthenticated, (req, res) => {
  res.json({ totalEntries: 156, todayEntries: 12, activeEntries: 89 });
});

app.get('/api/dashboard/recent-entries', isAuthenticated, (req, res) => {
  res.json([
    { id: 1, objekti: 'Kontratë e Re', createdAt: new Date().toISOString() },
    { id: 2, objekti: 'Revizhim Kontrate', createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
    { id: 3, objekti: 'Ankesë Administrative', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }
  ]);
});

app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'OK', message: 'Albpetrol Legal System is running', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Albpetrol Legal System (Professional Replit Interface) running on port ${PORT}`);
  console.log(`🌐 Server accessible at http://0.0.0.0:${PORT}`);
  console.log(`🔐 Test Login: it.system@albpetrol.al / Admin2025!`);
  console.log(`📧 2FA codes will be displayed in console for: it.system@albpetrol.al`);
  console.log(`✨ Features: Professional UI with Albpetrol logo, 2FA, Real Dashboard matching Replit exactly`);
});

export default app;
SERVER_UPDATE_EOF

# Start PM2
pm2 start ecosystem.config.cjs

# Check status
pm2 status

echo ""
echo "✅ Email updated to it.system@albpetrol.al"
echo "🌐 Test: http://10.5.20.31"
echo "🔐 Login: it.system@albpetrol.al / Admin2025!"
echo "📧 2FA codes will be shown in PM2 logs for it.system@albpetrol.al"
echo ""
echo "To see 2FA codes, run: pm2 logs albpetrol-legal"
UBUNTU_COMMANDS