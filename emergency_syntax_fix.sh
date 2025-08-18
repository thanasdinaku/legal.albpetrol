#!/bin/bash

# Emergency fix for case-entry-form.tsx syntax error
# Simple and direct approach

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Emergency Syntax Fix${NC}"

APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"
cd "$APP_DIR"

# Backup
cp "client/src/components/case-entry-form.tsx" "case-entry-form.backup.$(date +%s)"

echo -e "${BLUE}Checking current syntax error...${NC}"
sed -n '65,75p' client/src/components/case-entry-form.tsx

echo -e "${BLUE}Applying direct fix...${NC}"

# Find the broken line and fix it
sed -i '70s/onSuccess: () => {/onSuccess: () => {/' client/src/components/case-entry-form.tsx

# Ensure proper mutation structure
sed -i '/const createMutation = useMutation({/,/});/ {
  /},$/N
  /},\n *},$/c\
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
    onError: (error) => {\
      console.error("Data entry submission error:", error);\
      toast({\
        title: "Gabim në regjistrimin e çështjes",\
        description: error.message || "Ju lutemi provoni përsëri.",\
        variant: "destructive",\
      });\
    },\
  });
}' client/src/components/case-entry-form.tsx

echo -e "${BLUE}Testing build...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Build successful! Restarting service...${NC}"
    systemctl restart albpetrol-legal
    sleep 3
    systemctl reload nginx
    echo -e "${GREEN}Fix completed successfully${NC}"
else
    echo -e "${RED}Build failed. Check the file manually.${NC}"
    echo "View the file around line 70:"
    echo "sed -n '65,75p' client/src/components/case-entry-form.tsx"
fi