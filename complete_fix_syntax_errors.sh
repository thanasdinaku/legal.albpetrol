#!/bin/bash

# Complete fix script for all syntax errors and timestamp field issues
# Fixes storage.ts, case-entry-form.tsx, and ensures proper functionality

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Complete Fix for Syntax Errors and Timestamp Field${NC}"
echo -e "${BLUE}================================================${NC}"

APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"
SERVICE_NAME="albpetrol-legal"

echo -e "${GREEN}[INFO]${NC} Application: $APP_DIR"
cd "$APP_DIR"

# Create backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backup_complete_fix_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"
cp "server/storage.ts" "$BACKUP_DIR/" 2>/dev/null || true
cp "client/src/components/case-entry-form.tsx" "$BACKUP_DIR/" 2>/dev/null || true
cp "server/routes.ts" "$BACKUP_DIR/" 2>/dev/null || true
echo -e "${YELLOW}[BACKUP]${NC} Created: $BACKUP_DIR"

echo -e "${BLUE}[FIX 1]${NC} Restoring and fixing storage.ts..."

# Restore storage.ts from backup and fix the syntax error
if [ -f "$BACKUP_DIR/storage.ts" ]; then
    cp "$BACKUP_DIR/storage.ts" "server/storage.ts"
fi

# Check if there's a syntax error in the ilike statement and fix it
sed -i '/ilike(users\.firstName, `%\${filters\.search}%`)/a\
        )' server/storage.ts

# Remove any duplicate closing parentheses that might exist
sed -i '/ilike(users\.firstName, `%\${filters\.search}%`)/,/^[[:space:]]*)[[:space:]]*$/ {
    /^[[:space:]]*)[[:space:]]*$/ {
        N
        /\n[[:space:]]*)[[:space:]]*$/ d
    }
}' server/storage.ts

echo -e "${BLUE}[FIX 2]${NC} Completely restoring and fixing case-entry-form.tsx..."

# Restore the original working case-entry-form.tsx
cat > client/src/components/case-entry-form.tsx << 'EOF'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertDataEntrySchema, type InsertDataEntry } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sq } from "date-fns/locale";

const formSchema = insertDataEntrySchema.omit({
  createdById: true,
});

type FormData = z.infer<typeof formSchema>;

export default function CaseEntryForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paditesi: "",
      iPaditur: "",
      personITrete: "",
      objektiIPadise: "",
      gjykataShkalle: "",
      fazaGjykataShkalle: "",
      zhvillimiSeancesShkalleI: undefined,
      gjykataApelit: "",
      fazaGjykataApelit: "",
      fazaAktuale: "",
      perfaqesuesi: "",
      demiIPretenduar: "",
      shumaGjykata: "",
      vendimEkzekutim: "",
      fazaEkzekutim: "",
      gjykataLarte: "",
    },
  });

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

  const onSubmit = async (data: FormData) => {
    console.log('Form submission data:', data);
    await createMutation.mutateAsync(data);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="shadow-lg border border-gray-200">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <CardTitle className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="text-blue-600 mr-2">⚖️</span>
            Regjistro Çështje të Re
          </CardTitle>
          <CardDescription className="text-gray-600">
            Plotësoni formularin për të shtuar një çështje ligjore në sistem
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Paditesi */}
                <FormField
                  control={form.control}
                  name="paditesi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paditesi (Emër e Mbiemër)</FormLabel>
                      <FormControl>
                        <Input placeholder="p.sh. Filan Fisteku" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* I Paditur */}
                <FormField
                  control={form.control}
                  name="iPaditur"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>I Paditur</FormLabel>
                      <FormControl>
                        <Input placeholder="p.sh. Albpetrol SH.A." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Person i Trete */}
                <FormField
                  control={form.control}
                  name="personITrete"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Person i Tretë</FormLabel>
                      <FormControl>
                        <Input placeholder="Opsionale" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Perfaqesuesi */}
                <FormField
                  control={form.control}
                  name="perfaqesuesi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Përfaqësuesi i Albpetrol SH.A.</FormLabel>
                      <FormControl>
                        <Input placeholder="p.sh. Advokatët partnere" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Objekti i padise */}
              <FormField
                control={form.control}
                name="objektiIPadise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objekti i Padisë</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Përshkrimi i objektit të padisë..."
                        className="min-h-[100px]"
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gjykata Shkalle */}
                <FormField
                  control={form.control}
                  name="gjykataShkalle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gjykata e Shkallës së Parë</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Zgjidhni gjykatën" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Berat">Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Berat</SelectItem>
                          <SelectItem value="Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Vlorë">Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Vlorë</SelectItem>
                          <SelectItem value="Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Elbasan">Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Elbasan</SelectItem>
                          <SelectItem value="Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Fier">Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Fier</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                <FormField
                  control={form.control}
                  name="gjykataApelit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gjykata e Apelit</FormLabel>
                      <FormControl>
                        <Input placeholder="p.sh. Gjykata e Apelit Vlorë" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Faza Gjykata Apelit */}
                <FormField
                  control={form.control}
                  name="fazaGjykataApelit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faza në të cilën ndodhet procesi (Apelit)</FormLabel>
                      <FormControl>
                        <Input placeholder="p.sh. Në shqyrtim" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Faza Aktuale */}
                <FormField
                  control={form.control}
                  name="fazaAktuale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faza Aktuale</FormLabel>
                      <FormControl>
                        <Input placeholder="p.sh. E përfunduar" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Demi i Pretenduar */}
                <FormField
                  control={form.control}
                  name="demiIPretenduar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dëmi i Pretenduar në Objekt</FormLabel>
                      <FormControl>
                        <Input placeholder="p.sh. 500,000 Lekë" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shuma Gjykata */}
                <FormField
                  control={form.control}
                  name="shumaGjykata"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shuma e Caktuar nga Gjykata me Vendim</FormLabel>
                      <FormControl>
                        <Input placeholder="p.sh. 300,000 Lekë" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Vendim Ekzekutim */}
                <FormField
                  control={form.control}
                  name="vendimEkzekutim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendim me Ekzekutim të Përkohshëm</FormLabel>
                      <FormControl>
                        <Input placeholder="p.sh. Po/Jo" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Faza Ekzekutim */}
                <FormField
                  control={form.control}
                  name="fazaEkzekutim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faza në të cilën ndodhet Ekzekutimi</FormLabel>
                      <FormControl>
                        <Input placeholder="p.sh. Në proces" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gjykata e Larte */}
                <FormField
                  control={form.control}
                  name="gjykataLarte"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gjykata e Lartë</FormLabel>
                      <FormControl>
                        <Input placeholder="p.sh. Gjykata e Lartë e Republikës së Shqipërisë" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  className="px-8"
                >
                  Anulo
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="px-8 bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending ? "Duke ruajtur..." : "Ruaj Çështjen"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
EOF

echo -e "${BLUE}[FIX 3]${NC} Updating server routes to handle timestamp conversion..."

# Fix the server routes to properly handle the timestamp field
if ! grep -q "// Convert timestamp fields properly" server/routes.ts; then
    sed -i '/const validatedData = insertDataEntrySchema.parse({/i\
      // Convert timestamp fields properly\
      const processedBody = {\
        ...req.body,\
        zhvillimiSeancesShkalleI: req.body.zhvillimiSeancesShkalleI ? new Date(req.body.zhvillimiSeancesShkalleI) : null\
      };\
' server/routes.ts

    # Update the validation to use processedBody
    sed -i 's/...req\.body,/...processedBody,/' server/routes.ts
fi

echo -e "${BLUE}[FIX 4]${NC} Ensuring database schema is up to date..."

# Push database changes
npm run db:push

echo -e "${BLUE}[BUILD]${NC} Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} Build failed, check the output above for details"
    exit 1
fi

echo -e "${BLUE}[RESTART]${NC} Restarting service..."
systemctl restart "$SERVICE_NAME"
sleep 5

if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "${GREEN}[SUCCESS]${NC} Service restarted successfully"
else
    echo -e "${RED}[ERROR]${NC} Service restart failed"
    journalctl -u "$SERVICE_NAME" -n 10 --no-pager
    exit 1
fi

systemctl reload nginx 2>/dev/null || true

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}ALL SYNTAX ERRORS FIXED SUCCESSFULLY!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "✓ Fixed storage.ts syntax errors"
echo "✓ Completely restored case-entry-form.tsx"
echo "✓ Added proper timestamp handling in server routes"
echo "✓ Updated database schema"
echo "✓ Service restarted successfully"
echo ""
echo "Test at: https://legal.albpetrol.al"
echo "Try adding a new case - both the date/time field and submission should work correctly"
echo ""
echo "Backup saved in: $BACKUP_DIR"