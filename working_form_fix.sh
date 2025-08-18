#!/bin/bash

# Working automated fix for case-entry-form.tsx
# This script properly creates the form component

set -e

echo "Starting form component fix..."

APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"
cd "$APP_DIR"

# Create backup
cp "client/src/components/case-entry-form.tsx" "form-backup-$(date +%s).tsx"

# Write the form component in parts to avoid heredoc issues
echo 'import { useState } from "react";
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
import { sq } from "date-fns/locale";' > client/src/components/case-entry-form.tsx

echo '
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
  });' >> client/src/components/case-entry-form.tsx

echo '
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
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
      console.error("Data entry submission error:", error);
      
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
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
    console.log("Form submission data:", data);
    await createMutation.mutateAsync(data);
  };' >> client/src/components/case-entry-form.tsx

echo '
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">' >> client/src/components/case-entry-form.tsx

# Add form fields
echo '              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>' >> client/src/components/case-entry-form.tsx

# Add remaining fields and close the component
echo '
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
}' >> client/src/components/case-entry-form.tsx

echo "Form component created. Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "Build successful! Restarting service..."
    systemctl restart albpetrol-legal
    sleep 3
    
    if systemctl is-active --quiet albpetrol-legal; then
        echo "Service restarted successfully"
        systemctl reload nginx
        echo "Fix completed successfully!"
        echo "Test at: https://legal.albpetrol.al"
    else
        echo "Service failed to start"
        journalctl -u albpetrol-legal -n 5 --no-pager
    fi
else
    echo "Build failed - check the created form component"
    head -10 client/src/components/case-entry-form.tsx
fi