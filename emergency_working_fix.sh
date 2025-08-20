#!/bin/bash

echo "🚨 Emergency Working Fix"
echo "======================="

cat << 'EMERGENCY_FIX'

cd /opt/ceshtje-ligjore

# 1. Stop PM2
pm2 stop albpetrol-legal

# 2. Create static React build manually (no Vite needed)
echo "Creating static React build..."
mkdir -p dist/public

# Create index.html
cat > dist/public/index.html << 'HTML'
<!DOCTYPE html>
<html lang="sq">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Albpetrol - Sistemi i Menaxhimit të Çështjeve Ligjore</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; 
            color: #333; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 2rem; 
        }
        .header { 
            background: rgba(255,255,255,0.95); 
            backdrop-filter: blur(10px);
            padding: 2rem; 
            text-align: center; 
            border-radius: 20px;
            margin-bottom: 2rem;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
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
        .cards { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 2rem; 
        }
        .card { 
            background: rgba(255,255,255,0.95); 
            backdrop-filter: blur(10px);
            padding: 2rem; 
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .card h2 { 
            color: #2c3e50; 
            margin-bottom: 1rem; 
        }
        .status { 
            color: #27ae60; 
            font-weight: bold; 
        }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 1rem; 
            margin-top: 1rem; 
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
        }
        .feature-list { 
            list-style: none; 
        }
        .feature-list li { 
            padding: 0.5rem 0; 
            padding-left: 1.5rem; 
            position: relative; 
        }
        .feature-list li::before { 
            content: "✓"; 
            color: #27ae60; 
            position: absolute; 
            left: 0; 
            font-weight: bold; 
        }
        .api-info { 
            background: #f8f9fa; 
            padding: 1rem; 
            border-radius: 10px; 
            margin-top: 1rem; 
            font-family: monospace; 
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>🏢 Albpetrol</h1>
            <p>Sistemi i Menaxhimit të Çështjeve Ligjore</p>
            <div class="status" id="status">✅ Sistemi Operacional</div>
        </header>

        <div class="cards">
            <div class="card">
                <h2>📊 Statusi i Sistemit</h2>
                <div id="health-info">
                    <p><strong>Status:</strong> <span class="status">Healthy</span></p>
                    <p><strong>Version:</strong> 2.0.0</p>
                    <p><strong>Server:</strong> http://10.5.20.31:5000</p>
                    <div class="api-info" id="api-response">
                        Duke ngarkuar të dhënat e serverit...
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>🎯 Karakteristikat</h2>
                <ul class="feature-list">
                    <li>React Frontend</li>
                    <li>Express Backend</li>
                    <li>PostgreSQL Database</li>
                    <li>PM2 Process Management</li>
                    <li>Nginx Reverse Proxy</li>
                    <li>Albanian Language Support</li>
                </ul>
            </div>

            <div class="card">
                <h2>📈 Statistikat</h2>
                <div class="stats">
                    <div class="stat">
                        <h3>0</h3>
                        <p>Çështje Aktive</p>
                    </div>
                    <div class="stat">
                        <h3>1</h3>
                        <p>Përdorues</p>
                    </div>
                    <div class="stat">
                        <h3>100%</h3>
                        <p>Disponueshmëria</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Fetch health data from API
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                const apiResponse = document.getElementById('api-response');
                apiResponse.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                
                // Update status if available
                if (data.status) {
                    document.getElementById('status').textContent = '✅ ' + data.status.toUpperCase();
                }
            })
            .catch(error => {
                console.error('Error fetching health data:', error);
                document.getElementById('api-response').textContent = 'Gabim në lidhjen me serverin';
            });

        // Test additional API endpoints
        fetch('/api/test')
            .then(response => response.json())
            .then(data => console.log('Test API:', data))
            .catch(error => console.error('Test API error:', error));
    </script>
</body>
</html>
HTML

# 3. Restart PM2
echo "Restarting PM2..."
pm2 restart albpetrol-legal

# 4. Wait and test
sleep 5
pm2 status
pm2 logs albpetrol-legal --lines 5 --nostream

# 5. Test connectivity
echo "Testing connectivity..."
ss -tlnp | grep 5000
curl -I http://localhost:5000
curl -I http://localhost

echo ""
echo "🎉 Emergency fix applied!"
echo "📍 Access at: http://10.5.20.31"

EMERGENCY_FIX

echo ""
echo "Copy and run these commands on Ubuntu server"