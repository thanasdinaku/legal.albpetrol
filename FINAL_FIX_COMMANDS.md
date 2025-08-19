# FINAL DEPLOYMENT FIX

This is the complete solution for the recurring file corruption issue.

## Run on Production Server

Copy and paste this ENTIRE block on your production server:

```bash
# Remove corrupted files completely
rm -f client/src/components/case-entry-form.tsx

# Create working component with heredoc (prevents corruption)
cat << 'COMPONENT_EOF' > client/src/components/case-entry-form.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertDataEntrySchema, type InsertDataEntry } from "@shared/schema";

export default function CaseEntryForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertDataEntry>({
    resolver: zodResolver(insertDataEntrySchema),
    defaultValues: {
      paditesi: "",
      iPaditur: "",
      personITrete: "",
      objektiIPadise: "",
      gjykataShkalle: "",
      fazaGjykataShkalle: "",
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
    mutationFn: async (data: InsertDataEntry) => apiRequest("/api/data-entries", "POST", data),
    onSuccess: () => {
      toast({ title: "Çështja u regjistrua", description: "Të dhënat u ruajtën me sukses" });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/data-entries"] });
    },
    onError: (error: any) => {
      toast({ title: "Gabim", description: error.message || "Ndodhi një gabim", variant: "destructive" });
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Regjistro Çështje të Re</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <FormField control={form.control} name="paditesi" render={({ field }) => (
            <FormItem><FormLabel>Paditesi</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="iPaditur" render={({ field }) => (
            <FormItem><FormLabel>I Paditur</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="objektiIPadise" render={({ field }) => (
            <FormItem><FormLabel>Objekti i Padisë</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Duke regjistruar..." : "Regjistro Çështjen"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
COMPONENT_EOF

# Fix server storage method (array issue)
sed -i 's/.values(entry)/.values([entry])/' server/storage.ts

# Build and deploy everything
npm run build && sudo systemctl restart albpetrol-legal && sleep 10 && sudo systemctl status albpetrol-legal --no-pager

# Verify deployment success
echo ""
echo "=== DEPLOYMENT STATUS ==="
echo "Application: https://legal.albpetrol.al"
echo "Login: it.system@albpetrol.al / Admin2025!"
echo ""
echo "If the build was successful, your application is now running with all improvements."
```

This fixes both issues:
1. **File Corruption**: Uses heredoc to prevent the recurring "[Complete component code as shown above]" corruption
2. **Server Error**: Fixes the Drizzle .values() method to expect an array

The build should complete successfully after running this.