#!/bin/bash

# Direct fix for the syntax error in case-entry-form.tsx
# Fixes the malformed mutation function

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Direct Fix for case-entry-form.tsx Syntax Error${NC}"
echo -e "${BLUE}================================================${NC}"

APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"
SERVICE_NAME="albpetrol-legal"

cd "$APP_DIR"

# Create backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp "client/src/components/case-entry-form.tsx" "case-entry-form.tsx.backup_$TIMESTAMP"

echo -e "${BLUE}[FIX]${NC} Looking at the syntax error around line 70..."

# Check the exact content around line 70
echo "Content around line 70:"
sed -n '65,75p' client/src/components/case-entry-form.tsx

echo -e "${BLUE}[FIX]${NC} Repairing the mutation function syntax..."

# Find and fix the broken mutation function
# The issue is likely in the createMutation function structure
sed -i '/const createMutation = useMutation({/,/onError: (error) => {/ {
    /},$/,/},$/c\
    },\
    onSuccess: () => {\
      toast({\
        title: "Çështja u shtua me sukses",\
        description: "Çështja ligjore u regjistrua në bazën e të dhënave",\
      });\
      form.reset();\
      queryClient.invalidateQueries({ queryKey: ["/api/data-entries"] });\
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });\
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-entries"] });\
    },\
    onError: (error) => {
}' client/src/components/case-entry-form.tsx

# Alternative approach - completely replace the problematic section
cat > /tmp/mutation_fix.txt << 'EOF'
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Transform the data to ensure proper timestamp formatting
      const transformedData = {
        ...data,
        zhvillimiSeancesShkalleI: data.zhvillimiSeancesShkalleI ? new Date(data.zhvillimiSeancesShkalleI).toISOString() : null
      };
      const response = await apiRequest("/api/data-entries", "POST", transformedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Çështja u shtua me sukses",
        description: "Çështja ligjore u regjistrua në bazën e të dhënave",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/data-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-entries"] });
    },
    onError: (error) => {
      console.error('Data entry submission error:', error);
      
      // Handle authentication errors specifically
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast({
          title: "Pa Autorizim",
          description: "Jeni shkëputur. Duke u kyçur përsëri...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }

      toast({
        title: "Gabim në regjistrimin e çështjes",
        description: error.message || "Ju lutemi provoni përsëri ose kontaktoni administratorin.",
        variant: "destructive",
      });
    },
  });
EOF

# Replace the entire broken mutation section
sed -i '/const createMutation = useMutation({/,/});/c\
'"$(cat /tmp/mutation_fix.txt)" client/src/components/case-entry-form.tsx

# Clean up temp file
rm -f /tmp/mutation_fix.txt

echo -e "${BLUE}[CHECK]${NC} Verifying the fix..."

# Check syntax around the fixed area
echo "Content after fix (lines 50-80):"
sed -n '50,80p' client/src/components/case-entry-form.tsx

echo -e "${BLUE}[BUILD]${NC} Testing build..."

npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[SUCCESS]${NC} Build completed successfully!"
    
    echo -e "${BLUE}[RESTART]${NC} Restarting service..."
    systemctl restart "$SERVICE_NAME"
    sleep 3
    
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        echo -e "${GREEN}[SUCCESS]${NC} Service restarted successfully"
    else
        echo -e "${RED}[ERROR]${NC} Service failed to restart"
        journalctl -u "$SERVICE_NAME" -n 5 --no-pager
    fi
    
    systemctl reload nginx
    
else
    echo -e "${RED}[ERROR]${NC} Build still failing. Restoring backup..."
    cp "case-entry-form.tsx.backup_$TIMESTAMP" "client/src/components/case-entry-form.tsx"
    echo "Backup restored. The issue may be more complex."
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}SYNTAX ERROR FIX ATTEMPT COMPLETED${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Backup saved as: case-entry-form.tsx.backup_$TIMESTAMP"
echo ""
echo "Test at: https://legal.albpetrol.al"
echo "The case submission form should now work without syntax errors"