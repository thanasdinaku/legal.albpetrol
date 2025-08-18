#!/bin/bash

# Complete script to add court session date/time field to case registration form
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

APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"
SERVICE_NAME="albpetrol-legal"
FORM_FILE="client/src/components/case-entry-form.tsx"

echo -e "${GREEN}[INFO]${NC} Application: $APP_DIR"
cd "$APP_DIR"

# Create backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$FORM_FILE.backup_complete_$TIMESTAMP"
cp "$FORM_FILE" "$BACKUP_FILE"
echo -e "${YELLOW}[BACKUP]${NC} Created: $BACKUP_FILE"

echo -e "${BLUE}[UPDATE]${NC} Adding imports and date/time field..."

# Check if already has the field
if grep -q "Zhvillimi i seances gjyqesorë" "$FORM_FILE"; then
    echo -e "${YELLOW}[SKIP]${NC} Field already exists"
else
    # Add imports at the top
    if ! grep -q "Popover.*from.*popover" "$FORM_FILE"; then
        sed -i '/import.*Select.*from.*select/a\
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";\
import { Calendar } from "@/components/ui/calendar";' "$FORM_FILE"
    fi

    if ! grep -q "CalendarIcon.*from.*lucide" "$FORM_FILE"; then
        sed -i '/import.*zod/a\
import { CalendarIcon, Clock } from "lucide-react";\
import { cn } from "@/lib/utils";\
import { format } from "date-fns";\
import { sq } from "date-fns/locale";' "$FORM_FILE"
    fi

    # Add to default values
    if ! grep -q "zhvillimiSeancesShkalleI" "$FORM_FILE"; then
        sed -i '/fazaGjykataShkalle: ""/a\
      zhvillimiSeancesShkalleI: undefined,' "$FORM_FILE"
    fi

    # Create the complete form field replacement
    cat > /tmp/complete_field.txt << 'EOF'
                  {/* Faza Gjykata Shkalle */}
                  <FormField
                    control={form.control}
                    name="fazaGjykataShkalle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faza në të cilën ndodhet procesi (Shkallë I)</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. Në shqyrtim" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
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

    # Replace the entire section from fazaGjykataShkalle to Gjykata e Apelit
    sed -i '/\/\* Faza Gjykata Shkalle \*\//,/\/\* Gjykata e Apelit \*\// {
        /\/\* Faza Gjykata Shkalle \*\// {
            r /tmp/complete_field.txt
            d
        }
        /\/\* Gjykata e Apelit \*\// !d
    }' "$FORM_FILE"

    # Clean up temp file
    rm -f /tmp/complete_field.txt

    # Verify the change
    if grep -q "Zhvillimi i seances gjyqesorë" "$FORM_FILE"; then
        echo -e "${GREEN}[SUCCESS]${NC} Date/time field added successfully"
    else
        echo -e "${RED}[ERROR]${NC} Failed to add field, restoring backup"
        cp "$BACKUP_FILE" "$FORM_FILE"
        exit 1
    fi
fi

echo -e "${BLUE}[INSTALL]${NC} Installing date-fns dependency..."
npm install date-fns

echo -e "${BLUE}[BUILD]${NC} Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} Build failed, restoring backup"
    cp "$BACKUP_FILE" "$FORM_FILE"
    exit 1
fi

echo -e "${BLUE}[RESTART]${NC} Restarting service..."
systemctl restart "$SERVICE_NAME"
sleep 5

if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "${GREEN}[SUCCESS]${NC} Service restarted successfully"
else
    echo -e "${RED}[ERROR]${NC} Service restart failed"
    journalctl -u "$SERVICE_NAME" -n 5 --no-pager
    exit 1
fi

systemctl reload nginx 2>/dev/null || true

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}COURT SESSION FIELD ADDED SUCCESSFULLY!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "✓ Added 'Zhvillimi i seances gjyqesorë data,ora (Shkallë I)' field"
echo "✓ Albanian calendar date picker with 'Zgjidhni datën'"
echo "✓ 24-hour time input (HH:MM) with clock icon"
echo "✓ Combined date and time storage as timestamp"
echo "✓ Service restarted and running"
echo ""
echo "Test at: https://legal.albpetrol.al"
echo "Go to 'Regjistro Çështje' to see the new date/time field"
echo ""
echo "Backup saved as: $BACKUP_FILE"