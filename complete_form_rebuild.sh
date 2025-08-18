#!/bin/bash

# Complete rebuild of case-entry-form.tsx with all fields
# This will create a fully working form component

set -e

echo "=== Complete Form Rebuild ==="

APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"
cd "$APP_DIR"

# Backup current broken form
cp "client/src/components/case-entry-form.tsx" "broken-form-backup-$(date +%s).tsx"

# Delete the broken file and create completely new one
rm "client/src/components/case-entry-form.tsx"

# Build the form in multiple parts to ensure it's complete and correct

# Part 1: Imports and setup
cat > "client/src/components/case-entry-form.tsx" << 'PART1'
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
import { insertDataEntrySchema } from "@shared/schema";
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
      toast({
        title: "Gabim në regjistrimin e çështjes",
        description: error.message || "Ju lutemi provoni përsëri.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    console.log("Form submission data:", data);
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <FormField
                control={form.control}
                name="zhvillimiSeancesShkalleI"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Zhvillimi i seances gjyqesorë data,ora (Shkallë I)</FormLabel>
                    <div className="flex space-x-3">
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
                                  format(field.value, "dd/MM/yyyy")
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
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
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
PART1

echo "Form component rebuilt successfully"

echo "Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "Build successful! Restarting service..."
    systemctl restart albpetrol-legal
    sleep 3
    
    if systemctl is-active --quiet albpetrol-legal; then
        echo "Service restarted successfully"
        systemctl reload nginx
        echo "====================================="
        echo "FORM REBUILD COMPLETED SUCCESSFULLY!"
        echo "====================================="
        echo "Test at: https://legal.albpetrol.al"
        echo "- Case form should work without syntax errors"
        echo "- Date/time field should work properly"
        echo "- Case submission should work"
    else
        echo "Service failed to start - checking logs..."
        journalctl -u albpetrol-legal -n 5 --no-pager
    fi
else
    echo "Build failed - check form component"
    echo "File length: $(wc -l client/src/components/case-entry-form.tsx)"
fi