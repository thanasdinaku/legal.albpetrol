#!/bin/bash
# Fix 2FA email delivery on production server

echo "🔧 Fixing 2FA email delivery on production..."

# Check current SMTP configuration
echo "Checking SMTP environment variables..."
if [ -z "$SMTP_HOST" ]; then
    echo "❌ SMTP_HOST is not set"
    echo "Please set your SMTP configuration:"
    echo "export SMTP_HOST=smtp.gmail.com"
    echo "export SMTP_PORT=587"
    echo "export SMTP_USER=your-email@albpetrol.al"
    echo "export SMTP_PASS=your-app-password"
    echo "export SMTP_FROM=noreply@albpetrol.al"
    exit 1
fi

echo "✅ SMTP configuration found:"
echo "  Host: $SMTP_HOST"
echo "  Port: $SMTP_PORT"  
echo "  User: $SMTP_USER"
echo "  From: ${SMTP_FROM:-$SMTP_USER}"

# Apply the email fixes to production server
echo "Applying 2FA email fixes..."

# Fix 1: Update from field to use correct environment variable
sed -i 's/process\.env\.EMAIL_FROM/process.env.SMTP_FROM || process.env.SMTP_USER || '\''noreply@albpetrol.al'\''/g' server/email.ts

# Fix 2: Add detailed logging for 2FA email sending
sed -i '/console\.log(`Two-factor code sent to:/i\    console.log(`Attempting to send 2FA code to: ${user.email}`);' server/email.ts
sed -i '/console\.log(`Two-factor code sent to:/i\    console.log(`SMTP Config: Host: ${process.env.SMTP_HOST}, Port: ${process.env.SMTP_PORT}, User: ${process.env.SMTP_USER ? '\''configured'\'' : '\''missing'\''}`);' server/email.ts
sed -i '/console\.log(`Two-factor code sent to:/i\    console.log(`From address: ${mailOptions.from}`);' server/email.ts

# Fix 3: Improve error handling
sed -i 's/} catch (error) {/} catch (error: any) {/g' server/email.ts
sed -i 's/error\.message/error?.message/g' server/email.ts
sed -i 's/error\.code/error?.code/g' server/email.ts
sed -i 's/error\.response/error?.response/g' server/email.ts

echo "Building application with 2FA email fixes..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo "Restarting production service..."
    systemctl restart albpetrol-legal
    
    echo "Waiting for service to start..."
    sleep 5
    
    if systemctl is-active --quiet albpetrol-legal; then
        echo "✅ Service restarted successfully!"
        echo ""
        echo "🎉 2FA EMAIL FIXES DEPLOYED!"
        echo ""
        echo "📋 Applied fixes:"
        echo "   ✅ Fixed environment variable usage (SMTP_FROM instead of EMAIL_FROM)"
        echo "   ✅ Added detailed logging for email sending"
        echo "   ✅ Improved error handling and debugging"
        echo "   ✅ Added fallback sender addresses"
        echo ""
        echo "🔗 Test now at: https://legal.albpetrol.al"
        echo "   - Try logging in with thanas.dinaku@albpetrol.al"
        echo "   - Check server logs if no email received: journalctl -u albpetrol-legal -n 20"
        echo ""
        echo "📧 For Gmail SMTP, ensure you use an App Password, not your regular password"
        echo "   - Go to: https://myaccount.google.com/apppasswords"
        echo "   - Generate an App Password for 'Mail'"
        echo "   - Use that password as SMTP_PASS"
        echo ""
    else
        echo "❌ Service failed to start"
        systemctl status albpetrol-legal --no-pager
        echo ""
        echo "Check logs: journalctl -u albpetrol-legal -n 20"
    fi
else
    echo "❌ Build failed"
    echo "Check the error messages above"
fi

echo ""
echo "📱 Testing Email Delivery:"
echo "   1. Try to login with any user account"
echo "   2. Check server logs: journalctl -u albpetrol-legal -f"
echo "   3. Look for 'Attempting to send 2FA code to:' messages"
echo "   4. If emails still don't arrive, verify SMTP credentials"