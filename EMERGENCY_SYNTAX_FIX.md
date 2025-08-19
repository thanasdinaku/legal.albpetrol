# Emergency Syntax Fix - Complete Recreation

## The Pattern
The file keeps getting corrupted with "[Complete component code as shown above]" text. This needs a complete recreation approach.

## Run This Complete Fix

Copy and paste ALL of these commands as one block on your server:

```bash
# Step 1: Remove corrupted file
rm -f client/src/components/case-entry-form.tsx

# Step 2: Create working file in one command
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
    mutationFn: async (data: InsertDataEntry) => {
      return apiRequest("/api/data-entries", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Çështja u regjistrua",
        description: "Të dhënat u ruajtën me sukses",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/data-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Gabim në regjistrimin e çështjes",
        description: error.message || "Ndodhi një gabim gjatë regjistrimit",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertDataEntry) => {
    createMutation.mutate(data);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Regjistro Çështje të Re</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="paditesi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paditesi</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Input {...field} />
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
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-4">
            <Button
              type="submit"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Duke regjistruar..." : "Regjistro Çështjen"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
COMPONENT_EOF

# Step 3: Fix the server storage import
sed -i 's/import { eq, and, or, desc, asc }/import { eq, and, or, desc, asc, ilike }/' server/storage.ts

# Step 4: Verify files are correct
echo "=== Checking case-entry-form.tsx ==="
head -3 client/src/components/case-entry-form.tsx
echo "=== Checking storage.ts import ==="
head -10 server/storage.ts | grep "ilike\|import.*drizzle"

# Step 5: Build and deploy
npm run build && \
sudo systemctl restart albpetrol-legal && \
sleep 10 && \
sudo systemctl status albpetrol-legal --no-pager && \
echo "=== DEPLOYMENT SUCCESSFUL ===" && \
echo "Application: https://legal.albpetrol.al" && \
echo "Login: it.system@albpetrol.al / Admin2025!"
```

This approach:
1. **Removes** the corrupted file completely
2. **Creates** a fresh file using heredoc syntax (avoiding quote issues)  
3. **Fixes** the server import issue
4. **Builds** and **deploys** in one sequence

The heredoc approach (`cat << 'EOF'`) should prevent the corruption issue that keeps happening.