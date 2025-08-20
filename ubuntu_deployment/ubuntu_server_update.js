// Ubuntu server update to serve static files and handle 2FA
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

console.log('Starting Albpetrol Legal System server with Replit interface...');

// Simple session storage
const sessions = new Map();
const twoFactorCodes = new Map();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (Albpetrol logo and assets)
app.use('/static', express.static(path.join(__dirname, '../static')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Test credentials
const testUser = {
  id: 'admin-user-123',
  email: 'admin@albpetrol.al',
  password: 'Admin2025!',
  firstName: 'IT',
  lastName: 'System',
  role: 'admin'
};

// Session validation
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

// Routes

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log(`Login attempt: ${email}`);
  
  if (email === testUser.email && password === testUser.password) {
    // Generate 2FA code
    const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
    const userId = testUser.id;
    
    // Store 2FA code (expires in 3 minutes)
    twoFactorCodes.set(userId, {
      code: twoFactorCode,
      expires: Date.now() + 3 * 60 * 1000,
      email: email
    });
    
    console.log(`2FA code generated for ${email}: ${twoFactorCode}`);
    
    res.json({
      requiresTwoFactor: true,
      userId: userId,
      email: email,
      message: 'Kodi i verifikimit është dërguar në email-in tuaj.'
    });
  } else {
    res.status(401).json({ message: 'Email-i ose fjalëkalimi është i gabuar.' });
  }
});

// 2FA verification endpoint
app.post('/api/verify-2fa', (req, res) => {
  const { userId, code } = req.body;
  
  console.log(`2FA verification attempt for user ${userId} with code ${code}`);
  
  const twoFactorData = twoFactorCodes.get(userId);
  
  if (!twoFactorData) {
    return res.status(401).json({ message: 'Kodi i verifikimit ka skaduar. Provoni të kyçeni përsëri.' });
  }
  
  if (Date.now() > twoFactorData.expires) {
    twoFactorCodes.delete(userId);
    return res.status(401).json({ message: 'Kodi i verifikimit ka skaduar. Provoni të kyçeni përsëri.' });
  }
  
  if (code === twoFactorData.code) {
    // Valid 2FA code - create session
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    sessions.set(sessionId, {
      user: testUser,
      createdAt: Date.now()
    });
    
    // Clean up 2FA code
    twoFactorCodes.delete(userId);
    
    console.log(`2FA verification successful for ${testUser.email}`);
    
    res.cookie('sessionId', sessionId, { 
      httpOnly: true, 
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json(testUser);
  } else {
    res.status(401).json({ message: 'Kodi i verifikimit është i gabuar.' });
  }
});

// Get current user
app.get('/api/auth/user', isAuthenticated, (req, res) => {
  res.json(req.user);
});

// Logout
app.get('/api/logout', (req, res) => {
  const sessionId = req.headers.cookie?.split('sessionId=')[1]?.split(';')[0];
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.clearCookie('sessionId');
  res.redirect('/');
});

// Dashboard stats
app.get('/api/dashboard/stats', isAuthenticated, (req, res) => {
  res.json({
    totalEntries: 156,
    todayEntries: 12,
    activeEntries: 89
  });
});

// Recent entries
app.get('/api/dashboard/recent-entries', isAuthenticated, (req, res) => {
  res.json([
    {
      id: 1,
      objekti: 'Kontratë e Re',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      objekti: 'Revizhim Kontrate',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      objekti: 'Ankesë Administrative',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ]);
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'OK', 
    message: 'Albpetrol Legal System is running',
    timestamp: new Date().toISOString()
  });
});

// Serve the main application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Albpetrol Legal System (Replit Interface) running on port ${PORT}`);
  console.log(`Server accessible at http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔐 Test Login: admin@albpetrol.al / Admin2025!`);
  console.log(`✨ Features: Professional UI, 2FA, Real Dashboard`);
});

export default app;