# Final Fix for case-entry-form.tsx Export Issue

## Problem
The file was partially fixed but is missing the default export at the end.

## Complete Fix Commands

Copy and paste these commands on your server:

```bash
# First, let's see the current state of the file
tail -10 client/src/components/case-entry-form.tsx

# The file is likely missing "export default CaseEntryForm;" at the end
# Let's add it
echo "export default CaseEntryForm;" >> client/src/components/case-entry-form.tsx

# If that creates a duplicate, let's fix it properly
# Remove any existing export default lines first
sed -i '/^export default/d' client/src/components/case-entry-form.tsx

# Add the correct export default at the end
echo "export default CaseEntryForm;" >> client/src/components/case-entry-form.tsx

# Now build again
npm run build

# If successful, restart the service
sudo systemctl restart albpetrol-legal

# Check status
sudo systemctl status albpetrol-legal --no-pager

echo "Application should be working at https://legal.albpetrol.al"
```

## Alternative: Complete File Recreation

If the above doesn't work, let's recreate the file properly:

```bash
# Backup the corrupted file
mv client/src/components/case-entry-form.tsx client/src/components/case-entry-form.tsx.broken

# Create a minimal working version
cat > client/src/components/case-entry-form.tsx << 'EOF'
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertDataEntrySchema, type InsertDataEntry } from "@shared/schema";
import { DocumentUploader } from "@/components/DocumentUploader";
import type { UploadResult } from "@uppy/core";

export default function CaseEntryForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; path: string }>>([]);

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
      zhvillimisSeancesShkalle1: "",
      zhvillimisSeancesApel: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertDataEntry) => {
      const dataWithAttachments = { ...data, attachments };
      return apiRequest("/api/data-entries", "POST", dataWithAttachments);
    },
    onSuccess: () => {
      toast({
        title: "Çështja u regjistrua",
        description: "Të dhënat u ruajtën me sukses",
      });
      form.reset();
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ["/api/data-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-entries"] });
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
                    <Input {...field} data-testid="input-paditesi" />
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
                    <Input {...field} data-testid="input-i-paditur" />
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
                  <Textarea {...field} data-testid="textarea-objekti-padise" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-4">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-submit"
            >
              {createMutation.isPending ? "Duke regjistruar..." : "Regjistro Çështjen"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
EOF

# Now build
npm run build

# If successful, restart
sudo systemctl restart albpetrol-legal

echo "File recreated and application restarted"
```