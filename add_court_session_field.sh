#!/bin/bash

# Script to add "Zhvillimi i seances gjyqesorë data,ora (Shkalle I)" field to case registration form
# For Albanian Legal Case Management System on Ubuntu Server

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Adding Court Session Date/Time Field${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Application directory and service details
APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"
SERVICE_NAME="albpetrol-legal"
SCHEMA_FILE="shared/schema.ts"
FORM_FILE="client/src/components/case-entry-form.tsx"

echo -e "${GREEN}[INFO]${NC} Application directory: $APP_DIR"
echo -e "${GREEN}[INFO]${NC} Schema file: $SCHEMA_FILE"
echo -e "${GREEN}[INFO]${NC} Form file: $FORM_FILE"
echo -e "${GREEN}[INFO]${NC} Service: $SERVICE_NAME"

# Check if directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}[ERROR]${NC} Application directory not found: $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

# Check if files exist
for file in "$SCHEMA_FILE" "$FORM_FILE"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}[ERROR]${NC} Required file not found: $file"
        exit 1
    fi
done

# Create backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backup_court_session_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

cp "$SCHEMA_FILE" "$BACKUP_DIR/"
cp "$FORM_FILE" "$BACKUP_DIR/"
echo -e "${YELLOW}[BACKUP]${NC} Created backup in: $BACKUP_DIR"

echo ""
echo -e "${BLUE}[UPDATE]${NC} Step 1: Adding field to database schema..."

# Add the new field to the schema after fazaGjykataShkalle
if ! grep -q "zhvillimiSeancesShkalleI" "$SCHEMA_FILE"; then
    sed -i '/fazaGjykataShkalle: varchar.*Shkalle I/a\
  zhvillimiSeancesShkalleI: timestamp("zhvillimi_seances_shkalle_i"), // Zhvillimi i seances gjyqesorë data,ora (Shkalle I)' "$SCHEMA_FILE"
    
    if grep -q "zhvillimiSeancesShkalleI" "$SCHEMA_FILE"; then
        echo -e "${GREEN}[SUCCESS]${NC} Database schema updated"
    else
        echo -e "${RED}[ERROR]${NC} Failed to update database schema"
        exit 1
    fi
else
    echo -e "${YELLOW}[SKIP]${NC} Database field already exists"
fi

echo ""
echo -e "${BLUE}[UPDATE]${NC} Step 2: Updating form component imports..."

# Update imports to include date/time components
if ! grep -q "import.*Calendar.*from" "$FORM_FILE"; then
    sed -i '/import.*Select.*from.*select/a\
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";\
import { Calendar } from "@/components/ui/calendar";' "$FORM_FILE"
fi

if ! grep -q "import.*CalendarIcon.*from.*lucide-react" "$FORM_FILE"; then
    sed -i '/import.*from.*zod/a\
import { CalendarIcon, Clock } from "lucide-react";\
import { cn } from "@/lib/utils";\
import { format } from "date-fns";\
import { sq } from "date-fns/locale";' "$FORM_FILE"
fi

echo -e "${GREEN}[SUCCESS]${NC} Form imports updated"

echo ""
echo -e "${BLUE}[UPDATE]${NC} Step 3: Adding field to form default values..."

# Add field to default values
if ! grep -q "zhvillimiSeancesShkalleI" "$FORM_FILE"; then
    sed -i '/fazaGjykataShkalle: ""/a\
      zhvillimiSeancesShkalleI: undefined,' "$FORM_FILE"
    echo -e "${GREEN}[SUCCESS]${NC} Default values updated"
else
    echo -e "${YELLOW}[SKIP]${NC} Default value already exists"
fi

echo ""
echo -e "${BLUE}[UPDATE]${NC} Step 4: Adding date/time field to form..."

# Check if the form field already exists
if ! grep -q "Zhvillimi i seances gjyqesorë" "$FORM_FILE"; then
    # Find the line with fazaGjykataShkalle FormField and add after its closing />
    
    # Create the new form field content
    cat > /tmp/court_session_field.txt << 'EOF'
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
                                const timeValue = e.target.value; // "HH:mm" format
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
EOF

    # Find the line after fazaGjykataShkalle field ends and before Gjykata e Apelit
    sed -i '/fazaGjykataShkalle.*FormField/,/^\s*{\/\* Gjykata e Apelit \*\/}/ {
        /^\s*{\/\* Gjykata e Apelit \*\/}/ {
            r /tmp/court_session_field.txt
        }
    }' "$FORM_FILE"
    
    # Clean up temp file
    rm -f /tmp/court_session_field.txt
    
    if grep -q "Zhvillimi i seances gjyqesorë" "$FORM_FILE"; then
        echo -e "${GREEN}[SUCCESS]${NC} Date/time field added to form"
    else
        echo -e "${RED}[ERROR]${NC} Failed to add date/time field"
        echo -e "${YELLOW}[RESTORE]${NC} Restoring backup..."
        cp "$BACKUP_DIR/$FORM_FILE" "$FORM_FILE"
        cp "$BACKUP_DIR/$SCHEMA_FILE" "$SCHEMA_FILE"
        exit 1
    fi
else
    echo -e "${YELLOW}[SKIP]${NC} Date/time field already exists in form"
fi

echo ""
echo -e "${BLUE}[UPDATE]${NC} Step 5: Installing required dependencies..."

# Check if date-fns is installed
if ! grep -q '"date-fns"' package.json; then
    echo -e "${YELLOW}[INSTALL]${NC} Installing date-fns..."
    npm install date-fns
else
    echo -e "${GREEN}[SKIP]${NC} date-fns already installed"
fi

echo ""
echo -e "${BLUE}[UPDATE]${NC} Step 6: Updating database schema..."

# Push database changes
if command -v npm >/dev/null 2>&1; then
    echo -e "${GREEN}[DB]${NC} Pushing database schema changes..."
    npm run db:push
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[SUCCESS]${NC} Database schema updated successfully"
    else
        echo -e "${RED}[ERROR]${NC} Database schema update failed"
        exit 1
    fi
else
    echo -e "${YELLOW}[WARNING]${NC} npm not found, skipping database update"
fi

echo ""
echo -e "${BLUE}[BUILD]${NC} Step 7: Building application..."

if [ -f "package.json" ] && command -v npm >/dev/null 2>&1; then
    npm run build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[SUCCESS]${NC} Application built successfully"
    else
        echo -e "${RED}[ERROR]${NC} Build failed"
        echo -e "${YELLOW}[RESTORE]${NC} Restoring backup..."
        cp "$BACKUP_DIR/$FORM_FILE" "$FORM_FILE"
        cp "$BACKUP_DIR/$SCHEMA_FILE" "$SCHEMA_FILE"
        exit 1
    fi
else
    echo -e "${YELLOW}[WARNING]${NC} npm or package.json not found, skipping build"
fi

echo ""
echo -e "${BLUE}[RESTART]${NC} Step 8: Restarting service..."

if systemctl is-active --quiet "$SERVICE_NAME"; then
    systemctl restart "$SERVICE_NAME"
    sleep 5
    
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        echo -e "${GREEN}[SUCCESS]${NC} Service $SERVICE_NAME restarted successfully"
    else
        echo -e "${RED}[ERROR]${NC} Service failed to restart"
        echo -e "${YELLOW}[INFO]${NC} Check logs: journalctl -u $SERVICE_NAME -n 20"
        exit 1
    fi
else
    echo -e "${YELLOW}[WARNING]${NC} Service $SERVICE_NAME was not running"
    systemctl start "$SERVICE_NAME"
    sleep 5
fi

# Reload nginx if running
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}[RELOAD]${NC} Reloading nginx..."
    systemctl reload nginx
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}COURT SESSION FIELD ADDED SUCCESSFULLY!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

echo -e "${BLUE}Summary of Changes:${NC}"
echo "✓ Database schema: Added 'zhvillimiSeancesShkalleI' timestamp field"
echo "✓ Form component: Added date and time picker with Albanian localization"
echo "✓ UI components: Calendar picker with 'Zgjidhni datën' placeholder"
echo "✓ Time input: 24-hour format (HH:MM) with clock icon"
echo "✓ Language: Full Albanian localization using 'sq' locale"
echo ""
echo "✓ Files updated:"
echo "  - $SCHEMA_FILE"
echo "  - $FORM_FILE"
echo "✓ Backup created: $BACKUP_DIR"
echo "✓ Database schema pushed"
echo "✓ Application rebuilt"
echo "✓ Service $SERVICE_NAME restarted"
echo ""

echo -e "${BLUE}Test Your Changes:${NC}"
echo "1. Visit: https://legal.albpetrol.al"
echo "2. Click 'Regjistro Çështje' (Register Case)"
echo "3. Fill in the 'Faza në të cilën ndodhet procesi (Shkallë I)' field"
echo "4. Look for the new 'Zhvillimi i seances gjyqesorë data,ora (Shkallë I)' field below it"
echo "5. Test the date picker (calendar) and time input (HH:MM format)"
echo ""

echo -e "${BLUE}Features:${NC}"
echo "• Date picker with Albanian calendar"
echo "• Time input in 24-hour format (HH:MM)"
echo "• Combined date and time stored as timestamp"
echo "• Placeholder text: 'Zgjidhni datën'"
echo "• Clock icon for time input"
echo ""

echo -e "${BLUE}Service Status:${NC}"
systemctl status "$SERVICE_NAME" --no-pager -l | head -5

echo ""
echo -e "${BLUE}Rollback (if needed):${NC}"
echo "cp $BACKUP_DIR/* . && npm run db:push && npm run build && systemctl restart $SERVICE_NAME"