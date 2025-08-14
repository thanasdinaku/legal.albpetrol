#!/bin/bash

# Ubuntu Server Configuration Collection Script
# Run this script as root on your Ubuntu server (10.5.20.31)
# This will collect all necessary configuration files for security analysis

echo "=== Ubuntu Server Configuration Collection ==="
echo "Collecting system configurations for security analysis..."

# Create output directory
OUTPUT_DIR="/tmp/server_config_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$OUTPUT_DIR"

echo "Output directory: $OUTPUT_DIR"

# System Information
echo "=== Collecting System Information ==="
{
    echo "=== System Info ==="
    uname -a
    lsb_release -a
    hostnamectl
    echo -e "\n=== Uptime ==="
    uptime
    echo -e "\n=== Users ==="
    who
    last | head -20
} > "$OUTPUT_DIR/system_info.txt"

# Network Configuration
echo "=== Collecting Network Configuration ==="
{
    echo "=== Network Interfaces ==="
    ip addr show
    echo -e "\n=== Routing Table ==="
    ip route show
    echo -e "\n=== Listening Ports ==="
    netstat -tlnp
    echo -e "\n=== Active Connections ==="
    netstat -anp | grep ESTABLISHED
    echo -e "\n=== DNS Configuration ==="
    cat /etc/resolv.conf
} > "$OUTPUT_DIR/network_config.txt"

# Security Configuration
echo "=== Collecting Security Configuration ==="
{
    echo "=== UFW Status ==="
    ufw status verbose
    echo -e "\n=== IPTables Rules ==="
    iptables -L -n -v
    echo -e "\n=== Fail2Ban Status ==="
    fail2ban-client status 2>/dev/null || echo "Fail2Ban not installed"
    echo -e "\n=== SSH Configuration ==="
    grep -v "^#" /etc/ssh/sshd_config | grep -v "^$"
} > "$OUTPUT_DIR/security_config.txt"

# Service Configuration
echo "=== Collecting Service Configuration ==="
{
    echo "=== Running Services ==="
    systemctl list-units --type=service --state=running
    echo -e "\n=== Enabled Services ==="
    systemctl list-unit-files --type=service --state=enabled
    echo -e "\n=== Albpetrol Service ==="
    systemctl status albpetrol-legal --no-pager
    echo -e "\n=== Service File ==="
    cat /etc/systemd/system/albpetrol-legal.service 2>/dev/null
} > "$OUTPUT_DIR/services_config.txt"

# Web Server Configuration
echo "=== Collecting Web Server Configuration ==="
{
    echo "=== Nginx Configuration ==="
    nginx -t 2>&1
    echo -e "\n=== Main Nginx Config ==="
    cat /etc/nginx/nginx.conf
    echo -e "\n=== Site Configurations ==="
    ls -la /etc/nginx/sites-enabled/
    echo -e "\n=== Albpetrol Site Config ==="
    cat /etc/nginx/sites-available/legal-albpetrol 2>/dev/null || echo "Site config not found"
} > "$OUTPUT_DIR/webserver_config.txt"

# SSL/TLS Configuration
echo "=== Collecting SSL Configuration ==="
{
    echo "=== SSL Certificates ==="
    ls -la /etc/ssl/certs/ | grep albpetrol
    echo -e "\n=== Certificate Details ==="
    openssl x509 -in /etc/ssl/certs/albpetrol.crt -text -noout 2>/dev/null || echo "Certificate not found at standard location"
    echo -e "\n=== Cloudflare Configuration ==="
    cat /etc/cloudflared/config.yml 2>/dev/null || echo "Cloudflare config not found"
    systemctl status cloudflared --no-pager 2>/dev/null || echo "Cloudflared service not found"
} > "$OUTPUT_DIR/ssl_config.txt"

# Database Configuration
echo "=== Collecting Database Configuration ==="
{
    echo "=== PostgreSQL Status ==="
    systemctl status postgresql --no-pager
    echo -e "\n=== PostgreSQL Version ==="
    psql --version 2>/dev/null || echo "PostgreSQL client not found"
    echo -e "\n=== Database Connections ==="
    ss -tlnp | grep 5432 || echo "PostgreSQL not listening locally"
} > "$OUTPUT_DIR/database_config.txt"

# Application Configuration
echo "=== Collecting Application Configuration ==="
{
    echo "=== Application Directory ==="
    ls -la /opt/ceshtje_ligjore/ceshtje_ligjore/
    echo -e "\n=== Package.json ==="
    cat /opt/ceshtje_ligjore/ceshtje_ligjore/package.json 2>/dev/null
    echo -e "\n=== Environment Variables (filtered) ==="
    env | grep -E "(NODE_|DATABASE_|REPL)" | grep -v PASSWORD
    echo -e "\n=== Application Logs (last 50 lines) ==="
    journalctl -u albpetrol-legal -n 50 --no-pager
} > "$OUTPUT_DIR/application_config.txt"

# User and Permission Configuration
echo "=== Collecting User Configuration ==="
{
    echo "=== User Accounts ==="
    cat /etc/passwd
    echo -e "\n=== Sudo Configuration ==="
    cat /etc/sudoers
    echo -e "\n=== Group Memberships ==="
    groups root
    groups admuser 2>/dev/null || echo "admuser not found"
    echo -e "\n=== File Permissions ==="
    ls -la /opt/ceshtje_ligjore/
    ls -la /etc/nginx/sites-available/
    ls -la /etc/ssl/certs/ | grep albpetrol
} > "$OUTPUT_DIR/users_permissions.txt"

# Security Logs
echo "=== Collecting Security Logs ==="
{
    echo "=== Auth Log (last 100 lines) ==="
    tail -100 /var/log/auth.log
    echo -e "\n=== Nginx Access Log (last 50 lines) ==="
    tail -50 /var/log/nginx/access.log 2>/dev/null || echo "Nginx access log not found"
    echo -e "\n=== Nginx Error Log (last 50 lines) ==="
    tail -50 /var/log/nginx/error.log 2>/dev/null || echo "Nginx error log not found"
} > "$OUTPUT_DIR/security_logs.txt"

# System Performance and Resources
echo "=== Collecting System Performance ==="
{
    echo "=== Memory Usage ==="
    free -h
    echo -e "\n=== Disk Usage ==="
    df -h
    echo -e "\n=== CPU Info ==="
    lscpu
    echo -e "\n=== Load Average ==="
    cat /proc/loadavg
    echo -e "\n=== Running Processes ==="
    ps aux | head -20
} > "$OUTPUT_DIR/system_performance.txt"

# Create summary
echo "=== Creating Configuration Summary ==="
{
    echo "Configuration Collection Summary"
    echo "Generated: $(date)"
    echo "Server: $(hostname)"
    echo "Files collected:"
    ls -la "$OUTPUT_DIR"
} > "$OUTPUT_DIR/SUMMARY.txt"

# Create archive
echo "=== Creating Archive ==="
tar -czf "${OUTPUT_DIR}.tar.gz" -C "$(dirname $OUTPUT_DIR)" "$(basename $OUTPUT_DIR)"

echo ""
echo "✅ Configuration collection complete!"
echo ""
echo "📁 Archive created: ${OUTPUT_DIR}.tar.gz"
echo "📂 Directory: $OUTPUT_DIR"
echo ""
echo "To share with security analyst:"
echo "1. Download: scp root@10.5.20.31:${OUTPUT_DIR}.tar.gz ."
echo "2. Or copy files manually from: $OUTPUT_DIR/"
echo ""
echo "⚠️  Note: Review files before sharing - they contain system configuration details"