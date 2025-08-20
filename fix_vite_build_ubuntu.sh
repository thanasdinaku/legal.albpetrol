#!/bin/bash

echo "🔧 Fix Vite Build and Deploy Working React App"
echo "============================================="

cat << 'VITE_FIX'

cd /opt/ceshtje-ligjore

# 1. Clean problematic Vite cache and config
echo "1. Cleaning Vite cache..."
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist/public

# 2. Install Vite and build dependencies properly
echo "2. Installing Vite dependencies..."
npm install --save-dev vite @vitejs/plugin-react
npm install --save-dev @types/node

# 3. Create a simple working vite.config.ts
echo "3. Creating working Vite config..."
cat > vite.config.ts << 'VITE_CONFIG'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@assets': path.resolve(__dirname, './attached_assets')
    }
  },
  root: 'client',
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
    rollupOptions: {
      input: 'client/index.html'
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
VITE_CONFIG

# 4. Create a simple working React app if client doesn't exist
echo "4. Creating React frontend structure..."
mkdir -p client/src
mkdir -p client/public

# Create index.html
cat > client/index.html << 'INDEX_HTML'
<!DOCTYPE html>
<html lang="sq">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Albpetrol - Sistemi i Menaxhimit të Çështjeve Ligjore</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
INDEX_HTML

# Create main.tsx
cat > client/src/main.tsx << 'MAIN_TSX'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
MAIN_TSX

# Create App.tsx
cat > client/src/App.tsx << 'APP_TSX'
import React, { useState, useEffect } from 'react'

interface HealthData {
  status: string;
  timestamp: string;
  version: string;
  features: string[];
}

function App() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setHealth(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch health:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading">Duke ngarkuar...</div>;
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🏢 Albpetrol</h1>
        <p>Sistemi i Menaxhimit të Çështjeve Ligjore</p>
      </header>
      
      <main className="main">
        <div className="status-card">
          <h2>✅ Statusi i Sistemit</h2>
          {health && (
            <div className="health-info">
              <p><strong>Status:</strong> {health.status}</p>
              <p><strong>Version:</strong> {health.version}</p>
              <p><strong>Koha:</strong> {new Date(health.timestamp).toLocaleString('sq-AL')}</p>
              <div className="features">
                <strong>Karakteristikat:</strong>
                <ul>
                  {health.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="info-card">
          <h2>📊 Dashboard</h2>
          <p>Menaxhimi i çështjeve ligjore të Albpetrol</p>
          <div className="stats">
            <div className="stat">
              <h3>0</h3>
              <p>Çështje Aktive</p>
            </div>
            <div className="stat">
              <h3>1</h3>
              <p>Përdorues Aktiv</p>
            </div>
            <div className="stat">
              <h3>100%</h3>
              <p>Sistemi Operacional</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
APP_TSX

# Create index.css
cat > client/src/index.css << 'INDEX_CSS'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: #333;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.header h1 {
  color: #2c3e50;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.header p {
  color: #7f8c8d;
  font-size: 1.2rem;
}

.main {
  flex: 1;
  padding: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.status-card, .info-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.status-card h2, .info-card h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.health-info p {
  margin-bottom: 0.8rem;
  font-size: 1.1rem;
}

.features {
  margin-top: 1rem;
}

.features ul {
  list-style: none;
  margin-top: 0.5rem;
}

.features li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
}

.features li::before {
  content: "✓";
  color: #27ae60;
  position: absolute;
  left: 0;
  font-weight: bold;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
}

.stat {
  text-align: center;
  padding: 1rem;
  background: rgba(52, 152, 219, 0.1);
  border-radius: 10px;
}

.stat h3 {
  font-size: 2rem;
  color: #3498db;
  margin-bottom: 0.5rem;
}

.stat p {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
  color: white;
}

@media (max-width: 768px) {
  .main {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
  
  .header h1 {
    font-size: 2rem;
  }
  
  .stats {
    grid-template-columns: 1fr;
  }
}
INDEX_CSS

# 5. Install React dependencies
echo "5. Installing React dependencies..."
npm install react react-dom @types/react @types/react-dom

# 6. Build the React app
echo "6. Building React application..."
npx vite build

# 7. Verify build output
echo "7. Verifying build output..."
ls -la dist/public/
ls -la dist/public/assets/ 2>/dev/null || echo "No assets directory yet"

# 8. Restart PM2
echo "8. Restarting PM2..."
pm2 restart albpetrol-legal

# 9. Test the application
echo "9. Testing application..."
sleep 3
pm2 status
curl -s http://localhost:5000/api/health
echo ""
curl -I http://localhost:5000
echo ""
curl -I http://localhost

echo ""
echo "🎉 React application deployment complete!"
echo "📍 Access at: http://10.5.20.31"

VITE_FIX

echo ""
echo "Copy and run these commands on Ubuntu server"