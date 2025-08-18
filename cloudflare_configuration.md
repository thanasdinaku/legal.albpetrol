# Cloudflare Configuration Guide

## Critical: WAF Rule Configuration

After running the Ubuntu deployment script, you MUST configure Cloudflare to allow API requests through the tunnel.

### Step 1: Create WAF Custom Rule

1. **Login to Cloudflare Dashboard**
2. **Select domain**: `albpetrol.al`
3. **Navigate to**: Security → WAF → Custom Rules
4. **Create Custom Rule** with these exact settings:

   **Rule Name**: `API Bypass for Legal Subdomain`
   
   **Expression**:
   ```
   (http.host eq "legal.albpetrol.al" and http.request.uri.path contains "/api/")
   ```
   
   **Action**: `Skip`
   
   **Skip the following**:
   - ✅ All remaining custom rules
   - ✅ Managed Rulesets
   - ✅ Rate Limiting rules
   - ✅ Bot Fight Mode
   - ✅ Super Bot Fight Mode

5. **Save and Enable** the rule
6. **Move to TOP priority** in custom rules list

### Step 2: Alternative - Page Rules (if WAF unavailable)

1. **Go to**: Rules → Page Rules
2. **Create rule**:
   - **URL Pattern**: `legal.albpetrol.al/api/*`
   - **Settings**:
     - Security Level: `Essentially Off`
     - Cache Level: `Bypass`
     - Browser Integrity Check: `Off`
3. **Move to TOP** of page rules list

### Step 3: DNS Configuration

Verify your DNS settings:
```
Type: CNAME
Name: legal
Content: c51774f0-433f-40c0-a0b6-b7d3145fd95f.cfargotunnel.com
Proxy status: Proxied (orange cloud)
TTL: Auto
```

### Step 4: Test Configuration

After enabling the rule, wait 2-3 minutes then test:

```bash
curl -X POST https://legal.albpetrol.al/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test","password":"test"}'
```

**Expected**: JSON response (not HTML challenge page)

### Troubleshooting

If still seeing challenge pages:

1. **Check rule priority** - API bypass must be first
2. **Verify expression syntax** is exactly correct
3. **Check Bot Fight Mode** at account level
4. **Clear Cloudflare cache** in dashboard
5. **Wait 5 minutes** for global propagation

### Security Note

This configuration maintains security while allowing legitimate API access. The tunnel itself provides the secure connection from your server to Cloudflare's network.