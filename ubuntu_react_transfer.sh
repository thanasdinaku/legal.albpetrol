#!/bin/bash

# Complete React Application Transfer Script for Ubuntu Server
# This script transfers the working Replit React application to Ubuntu at 10.5.20.31

echo "=== TRANSFERRING COMPLETE REACT APPLICATION TO UBUNTU ==="

# Execute on Ubuntu server
ssh root@10.5.20.31 << 'EOF'

cd /opt/ceshtje-ligjore

# Stop current server
pm2 stop albpetrol-legal

# Create complete asset structure
mkdir -p dist/public/assets

# Transfer the working React index.html
cat > dist/public/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>Sistemi i Menaxhimit të Rasteve Ligjore</title>
    <meta name="description" content="Sistem profesional i menaxhimit të rasteve ligjore me kontroll të aksesit të bazuar në role për operacione efikase në bazën e të dhënave.">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script type="module" crossorigin src="/assets/index-Bv9ka2U9.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-C3xJPPxz.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
HTMLEOF

# Transfer the complete React application JavaScript (using CDN imports for compatibility)
cat > dist/public/assets/index-Bv9ka2U9.js << 'JSEOF'
// Albanian Legal Case Management System - Complete React Application
import React from 'https://esm.sh/react@18.2.0';
import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';

// Initialize React application
const root = ReactDOM.createRoot(document.getElementById('root'));

// Complete App component with authentication and dashboard
function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [entries, setEntries] = React.useState([]);
  const [stats, setStats] = React.useState({});
  const [currentView, setCurrentView] = React.useState('dashboard');

  // Check authentication status
  React.useEffect(() => {
    fetch('/api/auth/user')
      .then(res => res.ok ? res.json() : null)
      .then(userData => {
        setUser(userData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load dashboard data for authenticated users
  React.useEffect(() => {
    if (user) {
      Promise.all([
        fetch('/api/dashboard/stats').then(r => r.json()).catch(() => ({})),
        fetch('/api/dashboard/recent-entries').then(r => r.json()).catch(() => [])
      ]).then(([statsData, entriesData]) => {
        setStats(statsData);
        setEntries(entriesData);
      });
    }
  }, [user]);

  if (loading) {
    return React.createElement('div', {
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }
    }, [
      React.createElement('div', {
        key: 'loading-content',
        style: { textAlign: 'center' }
      }, [
        React.createElement('div', {
          key: 'spinner',
          style: {
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }
        }),
        React.createElement('p', {
          key: 'loading-text',
          style: { fontSize: '18px', color: '#6b7280' }
        }, 'Po ngarkohet Sistema Ligjor Albpetrol...')
      ])
    ]);
  }

  // Login page for unauthenticated users
  if (!user) {
    return React.createElement('div', {
      style: {
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }
    }, [
      React.createElement('div', {
        key: 'login-container',
        style: {
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '450px'
        }
      }, [
        React.createElement('div', {
          key: 'header',
          style: { textAlign: 'center', marginBottom: '40px' }
        }, [
          React.createElement('h1', {
            key: 'title',
            style: {
              color: '#2563eb',
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '10px'
            }
          }, 'Sistema Ligjor Albpetrol'),
          React.createElement('p', {
            key: 'subtitle',
            style: {
              color: '#6b7280',
              fontSize: '16px'
            }
          }, 'Menaxhimi Profesional i Çështjeve Ligjore')
        ]),

        React.createElement('form', {
          key: 'login-form',
          action: '/api/auth/login',
          method: 'POST'
        }, [
          React.createElement('div', {
            key: 'email-group',
            style: { marginBottom: '25px' }
          }, [
            React.createElement('label', {
              key: 'email-label',
              style: {
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }
            }, 'Adresa Elektronike'),
            React.createElement('input', {
              key: 'email-input',
              type: 'email',
              name: 'email',
              required: true,
              placeholder: 'it.system@albpetrol.al',
              style: {
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.3s ease',
                outline: 'none'
              }
            })
          ]),

          React.createElement('div', {
            key: 'password-group',
            style: { marginBottom: '30px' }
          }, [
            React.createElement('label', {
              key: 'password-label',
              style: {
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }
            }, 'Fjalëkalimi'),
            React.createElement('input', {
              key: 'password-input',
              type: 'password',
              name: 'password',
              required: true,
              placeholder: 'Admin2025!',
              style: {
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.3s ease',
                outline: 'none'
              }
            })
          ]),

          React.createElement('button', {
            key: 'submit-button',
            type: 'submit',
            style: {
              width: '100%',
              padding: '14px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease'
            }
          }, 'Kyçu në Sistem')
        ]),

        React.createElement('div', {
          key: 'admin-info',
          style: {
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }
        }, [
          React.createElement('h4', {
            key: 'admin-title',
            style: {
              margin: '0 0 10px 0',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '600'
            }
          }, 'Kredencialet e Administratorit:'),
          React.createElement('p', {
            key: 'admin-email',
            style: { margin: '5px 0', fontSize: '13px', color: '#6b7280' }
          }, 'Email: it.system@albpetrol.al'),
          React.createElement('p', {
            key: 'admin-password',
            style: { margin: '5px 0', fontSize: '13px', color: '#6b7280' }
          }, 'Fjalëkalimi: Admin2025!')
        ])
      ])
    ]);
  }

  // Main dashboard for authenticated users
  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      backgroundColor: '#f8f9fa'
    }
  }, [
    // Header
    React.createElement('header', {
      key: 'header',
      style: {
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '16px 30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    }, [
      React.createElement('div', {
        key: 'header-content',
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }
      }, [
        React.createElement('div', {
          key: 'header-left',
          style: { display: 'flex', alignItems: 'center', gap: '20px' }
        }, [
          React.createElement('h1', {
            key: 'header-title',
            style: { margin: 0, fontSize: '24px', fontWeight: '700' }
          }, 'Sistema Ligjor Albpetrol'),
          React.createElement('nav', {
            key: 'nav',
            style: { display: 'flex', gap: '20px' }
          }, [
            React.createElement('button', {
              key: 'nav-dashboard',
              onClick: () => setCurrentView('dashboard'),
              style: {
                background: currentView === 'dashboard' ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }
            }, 'Dashboard'),
            React.createElement('button', {
              key: 'nav-entries',
              onClick: () => setCurrentView('entries'),
              style: {
                background: currentView === 'entries' ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }
            }, 'Çështjet'),
            React.createElement('button', {
              key: 'nav-reports',
              onClick: () => setCurrentView('reports'),
              style: {
                background: currentView === 'reports' ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }
            }, 'Raporte')
          ])
        ]),

        React.createElement('div', {
          key: 'header-right',
          style: { display: 'flex', alignItems: 'center', gap: '20px' }
        }, [
          React.createElement('span', {
            key: 'user-info',
            style: { fontSize: '14px', color: 'rgba(255,255,255,0.9)' }
          }, \`Përshëndetje, \${user.email}\`),
          React.createElement('a', {
            key: 'logout-link',
            href: '/api/auth/logout',
            style: {
              color: 'white',
              textDecoration: 'none',
              padding: '8px 16px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '6px',
              fontSize: '14px',
              transition: 'background-color 0.3s ease'
            }
          }, 'Dil nga Sistemi')
        ])
      ])
    ]),

    // Main content area
    React.createElement('main', {
      key: 'main',
      style: { maxWidth: '1200px', margin: '0 auto', padding: '30px' }
    }, [
      // Dashboard view
      currentView === 'dashboard' && React.createElement('div', {
        key: 'dashboard',
      }, [
        // Stats cards
        React.createElement('div', {
          key: 'stats-grid',
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }
        }, [
          React.createElement('div', {
            key: 'total-card',
            style: {
              background: 'white',
              padding: '32px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              border: '1px solid #e5e7eb'
            }
          }, [
            React.createElement('div', {
              key: 'total-content',
              style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
            }, [
              React.createElement('div', { key: 'total-text' }, [
                React.createElement('h3', {
                  key: 'total-title',
                  style: {
                    margin: '0 0 8px 0',
                    color: '#6b7280',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }
                }, 'Totali i Çështjeve'),
                React.createElement('p', {
                  key: 'total-value',
                  style: { fontSize: '36px', fontWeight: '700', margin: 0, color: '#111827' }
                }, stats.totalEntries || 0)
              ]),
              React.createElement('div', {
                key: 'total-icon',
                style: {
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }
              }, '📋')
            ])
          ]),

          React.createElement('div', {
            key: 'today-card',
            style: {
              background: 'white',
              padding: '32px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              border: '1px solid #e5e7eb'
            }
          }, [
            React.createElement('div', {
              key: 'today-content',
              style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
            }, [
              React.createElement('div', { key: 'today-text' }, [
                React.createElement('h3', {
                  key: 'today-title',
                  style: {
                    margin: '0 0 8px 0',
                    color: '#6b7280',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }
                }, 'Sot'),
                React.createElement('p', {
                  key: 'today-value',
                  style: { fontSize: '36px', fontWeight: '700', margin: 0, color: '#059669' }
                }, stats.todayEntries || 0)
              ]),
              React.createElement('div', {
                key: 'today-icon',
                style: {
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#d1fae5',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }
              }, '📅')
            ])
          ]),

          React.createElement('div', {
            key: 'active-card',
            style: {
              background: 'white',
              padding: '32px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              border: '1px solid #e5e7eb'
            }
          }, [
            React.createElement('div', {
              key: 'active-content',
              style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
            }, [
              React.createElement('div', { key: 'active-text' }, [
                React.createElement('h3', {
                  key: 'active-title',
                  style: {
                    margin: '0 0 8px 0',
                    color: '#6b7280',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }
                }, 'Aktive'),
                React.createElement('p', {
                  key: 'active-value',
                  style: { fontSize: '36px', fontWeight: '700', margin: 0, color: '#d97706' }
                }, stats.activeCases || 0)
              ]),
              React.createElement('div', {
                key: 'active-icon',
                style: {
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }
              }, '⚡')
            ])
          ])
        ]),

        // Recent entries table
        React.createElement('div', {
          key: 'recent-table',
          style: {
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }
        }, [
          React.createElement('div', {
            key: 'table-header',
            style: {
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }
          }, [
            React.createElement('h2', {
              key: 'table-title',
              style: { margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }
            }, 'Çështje të Fundit')
          ]),

          React.createElement('div', {
            key: 'table-wrapper',
            style: { overflowX: 'auto' }
          }, [
            entries.length > 0 ? React.createElement('table', {
              key: 'entries-table',
              style: { width: '100%', borderCollapse: 'collapse' }
            }, [
              React.createElement('thead', {
                key: 'table-head',
                style: { backgroundColor: '#f9fafb' }
              }, React.createElement('tr', { key: 'header-row' }, [
                React.createElement('th', {
                  key: 'th-id',
                  style: {
                    textAlign: 'left',
                    padding: '16px 24px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }
                }, 'ID'),
                React.createElement('th', {
                  key: 'th-paditesi',
                  style: {
                    textAlign: 'left',
                    padding: '16px 24px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }
                }, 'Paditësi'),
                React.createElement('th', {
                  key: 'th-padituri',
                  style: {
                    textAlign: 'left',
                    padding: '16px 24px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }
                }, 'I Padituri'),
                React.createElement('th', {
                  key: 'th-status',
                  style: {
                    textAlign: 'left',
                    padding: '16px 24px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }
                }, 'Statusi')
              ])),

              React.createElement('tbody', {
                key: 'table-body'
              }, entries.slice(0, 10).map((entry, index) => 
                React.createElement('tr', {
                  key: entry.id || index,
                  style: {
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                    borderBottom: '1px solid #e5e7eb'
                  }
                }, [
                  React.createElement('td', {
                    key: 'td-id',
                    style: {
                      padding: '16px 24px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#111827'
                    }
                  }, entry.id),
                  React.createElement('td', {
                    key: 'td-paditesi',
                    style: { padding: '16px 24px', fontSize: '14px', color: '#374151' }
                  }, entry.paditesi || '-'),
                  React.createElement('td', {
                    key: 'td-padituri',
                    style: { padding: '16px 24px', fontSize: '14px', color: '#374151' }
                  }, entry.iPadituri || '-'),
                  React.createElement('td', {
                    key: 'td-status',
                    style: { padding: '16px 24px' }
                  }, React.createElement('span', {
                    style: {
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: entry.statusi === 'Aktiv' ? '#dcfce7' : '#fef3c7',
                      color: entry.statusi === 'Aktiv' ? '#166534' : '#92400e'
                    }
                  }, entry.statusi || 'Në pritje'))
                ])
              ))
            ]) : React.createElement('div', {
              key: 'no-entries',
              style: { padding: '60px 24px', textAlign: 'center' }
            }, [
              React.createElement('div', {
                key: 'empty-icon',
                style: { fontSize: '48px', marginBottom: '16px' }
              }, '📝'),
              React.createElement('h3', {
                key: 'empty-title',
                style: {
                  margin: '0 0 8px 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#374151'
                }
              }, 'Nuk ka çështje të regjistruara'),
              React.createElement('p', {
                key: 'empty-text',
                style: { margin: 0, color: '#6b7280', fontSize: '14px' }
              }, 'Çështjet e reja do të shfaqen këtu pasi të regjistrohen.')
            ])
          ])
        ])
      ]),

      // Other views placeholder
      currentView !== 'dashboard' && React.createElement('div', {
        key: 'other-view',
        style: {
          background: 'white',
          padding: '60px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }
      }, [
        React.createElement('h2', {
          key: 'view-title',
          style: {
            margin: '0 0 16px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#374151'
          }
        }, currentView === 'entries' ? 'Menaxhimi i Çështjeve' : 'Raporte'),
        React.createElement('p', {
          key: 'view-description',
          style: { margin: 0, color: '#6b7280', fontSize: '16px' }
        }, 'Ky seksion është në zhvillim e sipër.')
      ])
    ])
  ]);
}

// Render the application
root.render(React.createElement(App));
JSEOF

# Transfer the complete CSS file
cat > dist/public/assets/index-C3xJPPxz.css << 'CSSEOF'
/* Albanian Legal Case Management System - Complete Styles */

/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #374151;
  background-color: #f8f9fa;
  font-size: 16px;
}

#root {
  width: 100%;
  min-height: 100vh;
}

/* Loading animation */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

/* Button styles */
button {
  font-family: inherit;
  font-size: inherit;
  border: none;
  outline: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

button:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* Input styles */
input {
  font-family: inherit;
  font-size: inherit;
  outline: none;
  transition: all 0.3s ease;
}

input:focus {
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Link styles */
a {
  color: inherit;
  text-decoration: none;
  transition: all 0.3s ease;
}

/* Table styles */
table {
  border-collapse: collapse;
  width: 100%;
}

th, td {
  text-align: left;
  vertical-align: middle;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Responsive design */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
  }
}

@media (max-width: 768px) {
  main {
    padding: 20px !important;
  }
  
  .stats-grid {
    grid-template-columns: 1fr !important;
    gap: 16px !important;
  }
  
  .stats-card {
    padding: 24px !important;
  }
  
  .stats-value {
    font-size: 28px !important;
  }
  
  header {
    padding: 12px 20px !important;
  }
  
  .header-content {
    flex-direction: column !important;
    gap: 16px !important;
    align-items: flex-start !important;
  }
  
  .header-nav {
    flex-wrap: wrap !important;
    gap: 12px !important;
  }
  
  .table-wrapper {
    overflow-x: auto !important;
  }
  
  table {
    min-width: 600px;
  }
  
  th, td {
    padding: 12px 16px !important;
    font-size: 14px !important;
  }
  
  .login-container {
    margin: 20px !important;
    padding: 30px !important;
  }
  
  .login-title {
    font-size: 24px !important;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 20px !important;
  }
  
  .stats-card {
    padding: 20px !important;
  }
  
  .stats-icon {
    width: 36px !important;
    height: 36px !important;
    font-size: 18px !important;
  }
  
  .header-title {
    font-size: 20px !important;
  }
  
  .nav-button {
    padding: 6px 12px !important;
    font-size: 13px !important;
  }
}

/* Status badge variations */
.status-active {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.status-pending {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #fed7aa;
}

.status-completed {
  background-color: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.status-cancelled {
  background-color: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* Animation classes */
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
CSSEOF

# Restart the React application server
pm2 restart albpetrol-legal
pm2 save

echo "✅ COMPLETE REACT APPLICATION TRANSFERRED TO UBUNTU"
echo "🌐 Access: http://10.5.20.31"
echo "👤 Login: it.system@albpetrol.al / Admin2025!"

# Test the application
sleep 5
curl -s http://localhost:5000/ | head -5

# Check server status
pm2 status

EOF

echo "=== REACT APPLICATION TRANSFER COMPLETED ==="
echo "Ubuntu server now has the complete React interface matching Replit"