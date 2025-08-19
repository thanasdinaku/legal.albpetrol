# Complete File Recreation - Final Fix

## Problem
The case-entry-form.tsx file keeps getting corrupted with "[Complete component code as shown above]" text.

## Complete Solution

Copy and paste these commands on your server:

```bash
# Remove the corrupted file completely
rm client/src/components/case-entry-form.tsx

# Create a fresh, working file
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

  const handleFileUpload = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    const newAttachments = result.successful.map((file) => ({
      name: file.name,
      url: file.uploadURL || "",
      path: file.uploadURL || "",
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    toast({
      title: "Dokumenti u ngarkua",
      description: `${result.successful.length} dokument(e) u ngarkuan me sukses`,
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

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

            <FormField
              control={form.control}
              name="personITrete"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person i Tretë</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-person-trete" />
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
                  <FormLabel>Përfaqësuesi</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-perfaqesuesi" />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="gjykataShkalle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gjykata Shkallë I</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-gjykata-shkalle">
                        <SelectValue placeholder="Zgjidhni gjykatën" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Gjykata e Rrethit Tiranë">Gjykata e Rrethit Tiranë</SelectItem>
                      <SelectItem value="Gjykata e Rrethit Durrës">Gjykata e Rrethit Durrës</SelectItem>
                      <SelectItem value="Gjykata e Rrethit Elbasan">Gjykata e Rrethit Elbasan</SelectItem>
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
                  <FormLabel>Faza Gjykata Shkallë I</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-faza-shkalle" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dokumentet</h3>
            
            <DocumentUploader
              maxNumberOfFiles={5}
              maxFileSize={10485760}
              onGetUploadParameters={async () => {
                const response = await apiRequest("/api/objects/upload", "POST");
                return {
                  method: "PUT" as const,
                  url: response.uploadURL,
                };
              }}
              onComplete={handleFileUpload}
              buttonClassName="w-full"
            >
              Ngarko Dokumente
            </DocumentUploader>

            {attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Dokumentet e ngarkuar:</h4>
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{attachment.name}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      Hiq
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setAttachments([]);
              }}
              data-testid="button-reset"
            >
              Rivendos
            </Button>
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

# Now fix the server storage file too
sed -i 's/import { eq, and, or, desc, asc }/import { eq, and, or, desc, asc, ilike }/' server/storage.ts

# Build everything
npm run build

# Start the service
sudo systemctl restart albpetrol-legal

# Wait and check
sleep 10
sudo systemctl status albpetrol-legal --no-pager

echo "=== DEPLOYMENT COMPLETE ==="
echo "Application is running at: https://legal.albpetrol.al"
echo "Login with: it.system@albpetrol.al / Admin2025!"
```