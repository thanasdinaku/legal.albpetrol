#!/bin/bash

# Fixed script to add court session date/time field to case registration form
# For Albanian Legal Case Management System on Ubuntu Server

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Fixing Court Session Date/Time Field${NC}"
echo -e "${BLUE}================================================${NC}"

APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"
SERVICE_NAME="albpetrol-legal"
FORM_FILE="client/src/components/case-entry-form.tsx"

echo -e "${GREEN}[INFO]${NC} Application: $APP_DIR"
cd "$APP_DIR"

# Create backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$FORM_FILE.backup_fix_$TIMESTAMP"
cp "$FORM_FILE" "$BACKUP_FILE"
echo -e "${YELLOW}[BACKUP]${NC} Created: $BACKUP_FILE"

echo -e "${BLUE}[FIX]${NC} Adding the date/time field properly..."

# Create a temporary file with the new form field
cat > /tmp/court_session_field.patch << 'EOF'
                  />
                </div>

                {/* Zhvillimi i seances gjyqesorë data,ora (Shkalle I) */}
                <FormField
                  control={form.control}
                  name="zhvillimiSeancesShkalleI"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Zhvillimi i seances gjyqesorë data,ora (Shkallë I)</FormLabel>
                      <div className="flex space-x-3">
                        {/* Date Picker */}
                        <div className="flex-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy", { locale: sq })
                                  ) : (
                                    <span>Zgjidhni datën</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    const currentDateTime = field.value ? new Date(field.value) : new Date();
                                    const newDateTime = new Date(date);
                                    newDateTime.setHours(currentDateTime.getHours());
                                    newDateTime.setMinutes(currentDateTime.getMinutes());
                                    field.onChange(newDateTime);
                                  }
                                }}
                                locale={sq}
                                disabled={(date) => date < new Date("1900-01-01")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        {/* Time Input */}
                        <div className="flex-1">
                          <div className="relative">
                            <Input
                              type="time"
                              className="pl-10"
                              value={
                                field.value
                                  ? format(field.value, "HH:mm")
                                  : ""
                              }
                              onChange={(e) => {
                                const timeValue = e.target.value;
                                if (timeValue) {
                                  const currentDate = field.value ? new Date(field.value) : new Date();
                                  const [hours, minutes] = timeValue.split(":").map(Number);
                                  const newDateTime = new Date(currentDate);
                                  newDateTime.setHours(hours);
                                  newDateTime.setMinutes(minutes);
                                  field.onChange(newDateTime);
                                }
                              }}
                            />
                            <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gjykata e Apelit */}
EOF

# Find the line with fazaGjykataShkalle and add the new field after it
sed -i '/fazaGjykataShkalle.*FormField/,/^\s*{\/\* Gjykata e Apelit \*\/}/ {
    /^\s*{\/\* Gjykata e Apelit \*\/}/ {
        r /tmp/court_session_field.patch
        d
    }
}' "$FORM_FILE"

# Clean up
rm -f /tmp/court_session_field.patch

# Verify the field was added
if grep -q "Zhvillimi i seances gjyqesorë" "$FORM_FILE"; then
    echo -e "${GREEN}[SUCCESS]${NC} Date/time field added successfully"
else
    echo -e "${RED}[ERROR]${NC} Failed to add field. Trying alternative method..."
    
    # Restore backup and try different approach
    cp "$BACKUP_FILE" "$FORM_FILE"
    
    # Find the exact line and add after it
    LINE_NUM=$(grep -n "fazaGjykataShkalle.*FormField" "$FORM_FILE" | cut -d: -f1)
    if [ -n "$LINE_NUM" ]; then
        # Find the end of this FormField block
        END_LINE=$(tail -n +$LINE_NUM "$FORM_FILE" | grep -n "^\s*})" | head -1 | cut -d: -f1)
        END_LINE=$((LINE_NUM + END_LINE - 1))
        
        # Add our field after the closing of fazaGjykataShkalle
        sed -i "${END_LINE}a\\
\\
                {/* Zhvillimi i seances gjyqesorë data,ora (Shkalle I) */}\\
                <FormField\\
                  control={form.control}\\
                  name=\"zhvillimiSeancesShkalleI\"\\
                  render={({ field }) => (\\
                    <FormItem className=\"space-y-3\">\\
                      <FormLabel>Zhvillimi i seances gjyqesorë data,ora (Shkallë I)</FormLabel>\\
                      <div className=\"flex space-x-3\">\\
                        <div className=\"flex-1\">\\
                          <Popover>\\
                            <PopoverTrigger asChild>\\
                              <FormControl>\\
                                <Button\\
                                  variant=\"outline\"\\
                                  className={cn(\\
                                    \"w-full pl-3 text-left font-normal\",\\
                                    !field.value && \"text-muted-foreground\"\\
                                  )}\\
                                >\\
                                  {field.value ? (\\
                                    format(field.value, \"dd/MM/yyyy\", { locale: sq })\\
                                  ) : (\\
                                    <span>Zgjidhni datën</span>\\
                                  )}\\
                                  <CalendarIcon className=\"ml-auto h-4 w-4 opacity-50\" />\\
                                </Button>\\
                              </FormControl>\\
                            </PopoverTrigger>\\
                            <PopoverContent className=\"w-auto p-0\" align=\"start\">\\
                              <Calendar\\
                                mode=\"single\"\\
                                selected={field.value ? new Date(field.value) : undefined}\\
                                onSelect={(date) => {\\
                                  if (date) {\\
                                    const currentDateTime = field.value ? new Date(field.value) : new Date();\\
                                    const newDateTime = new Date(date);\\
                                    newDateTime.setHours(currentDateTime.getHours());\\
                                    newDateTime.setMinutes(currentDateTime.getMinutes());\\
                                    field.onChange(newDateTime);\\
                                  }\\
                                }}\\
                                locale={sq}\\
                                disabled={(date) => date < new Date(\"1900-01-01\")}\\
                                initialFocus\\
                              />\\
                            </PopoverContent>\\
                          </Popover>\\
                        </div>\\
                        <div className=\"flex-1\">\\
                          <div className=\"relative\">\\
                            <Input\\
                              type=\"time\"\\
                              className=\"pl-10\"\\
                              value={field.value ? format(field.value, \"HH:mm\") : \"\"}\\
                              onChange={(e) => {\\
                                const timeValue = e.target.value;\\
                                if (timeValue) {\\
                                  const currentDate = field.value ? new Date(field.value) : new Date();\\
                                  const [hours, minutes] = timeValue.split(\":\").map(Number);\\
                                  const newDateTime = new Date(currentDate);\\
                                  newDateTime.setHours(hours);\\
                                  newDateTime.setMinutes(minutes);\\
                                  field.onChange(newDateTime);\\
                                }\\
                              }}\\
                            />\\
                            <Clock className=\"absolute left-3 top-3 h-4 w-4 text-gray-400\" />\\
                          </div>\\
                        </div>\\
                      </div>\\
                      <FormMessage />\\
                    </FormItem>\\
                  )}\\
                />" "$FORM_FILE"
        
        if grep -q "Zhvillimi i seances gjyqesorë" "$FORM_FILE"; then
            echo -e "${GREEN}[SUCCESS]${NC} Field added with alternative method"
        else
            echo -e "${RED}[ERROR]${NC} Both methods failed"
            exit 1
        fi
    fi
fi

echo -e "${BLUE}[INSTALL]${NC} Installing date-fns dependency..."
npm install date-fns

echo -e "${BLUE}[BUILD]${NC} Building application..."
npm run build

echo -e "${BLUE}[RESTART]${NC} Restarting service..."
systemctl restart "$SERVICE_NAME"
sleep 3

if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "${GREEN}[SUCCESS]${NC} Service restarted successfully"
else
    echo -e "${RED}[ERROR]${NC} Service restart failed"
    exit 1
fi

systemctl reload nginx 2>/dev/null || true

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}COURT SESSION FIELD FIXED AND ADDED!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "✓ Date/time field added to form"
echo "✓ Albanian calendar with 'Zgjidhni datën'"
echo "✓ 24-hour time input (HH:MM)"
echo "✓ Service restarted"
echo ""
echo "Test at: https://legal.albpetrol.al"
echo "Go to 'Regjistro Çështje' and look for the new date/time field"