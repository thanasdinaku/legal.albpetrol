#!/bin/bash

echo "=================================="
echo "Attachment Window Update Deployment"
echo "=================================="

# Navigate to project directory
cd /opt/ceshtje-ligjore || exit 1

# Backup current files
echo "📦 Creating backup..."
mkdir -p backups
cp client/src/components/case-entry-form.tsx backups/case-entry-form.tsx.backup.$(date +%Y%m%d_%H%M%S)
cp client/src/components/case-edit-form.tsx backups/case-edit-form.tsx.backup.$(date +%Y%m%d_%H%M%S)

# Update case-entry-form.tsx
echo "📝 Updating case-entry-form.tsx..."
cat > client/src/components/case-entry-form.tsx << 'ENTRY_FORM_EOF'
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
import { CalendarIcon, Clock, FileText, Download, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DocumentUploader } from "@/components/DocumentUploader";
import { ScrollHintContainer } from "@/components/ui/scroll-hint-container";
import type { UploadResult } from "@uppy/core";

const formSchema = insertDataEntrySchema;

type FormData = z.infer<typeof formSchema>;

export default function CaseEntryForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; path: string }>>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paditesi: "",
      iPaditur: "",
      personITrete: "",
      objektiIPadise: "",
      gjykataShkalle: "",
      fazaGjykataShkalle: "",
      zhvillimiSeancesShkalleI: "",
      gjykataApelit: "",
      fazaGjykataApelit: "",
      zhvillimiSeancesApel: "",
      fazaAktuale: "",
      perfaqesuesi: "",
      demiIPretenduar: "",
      shumaGjykata: "",
      vendimEkzekutim: "",
      fazaEkzekutim: "",
      ankimuar: "",
      perfunduar: "",
      gjykataLarte: "",
    },
  });

  // Store datetime exactly as entered (no timezone conversion)
  const convertToUTC = (datetimeLocal: string) => {
    if (!datetimeLocal) return "";
    console.log(\`Storing time exactly as entered: \${datetimeLocal}\`);
    return datetimeLocal; // Store exactly as entered
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const transformedData = {
        ...data,
        zhvillimiSeancesShkalleI: convertToUTC(data.zhvillimiSeancesShkalleI || ""),
        zhvillimiSeancesApel: convertToUTC(data.zhvillimiSeancesApel || ""),
        attachments: attachments
      };
      console.log("Submitting case data:", transformedData);
      const response = await apiRequest("/api/data-entries", "POST", transformedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Çështja u shtua me sukses",
        description: "Çështja ligjore u regjistrua në bazën e të dhënave",
      });
      form.reset();
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ["/api/data-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-entries"] });
    },
    onError: (error) => {
      console.error("Case submission error:", error);
      toast({
        title: "Gabim në regjistrimin e çështjes",
        description: error.message || "Ju lutemi provoni përsëri ose kontaktoni administratorin.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    console.log("Form submission data:", data);
    
    // Check required fields
    if (!data.paditesi || data.paditesi.trim() === "") {
      toast({
        title: "Gabim në plotësimin e formularit",
        description: "Fusha 'Paditesi' është e detyrueshme",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.iPaditur || data.iPaditur.trim() === "") {
      toast({
        title: "Gabim në plotësimin e formularit", 
        description: "Fusha 'I Paditur' është e detyrueshme",
        variant: "destructive",
      });
      return;
    }
    
    await createMutation.mutateAsync(data);
  };


  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    console.log("Upload complete result:", result);
    const uploadedFiles = (result.successful || []).map((file) => {
      const originalName = file.name || 'document';
      const uploadURL = file.uploadURL as string;
      console.log("Processing uploaded file:", { name: originalName, uploadURL });
      
      // Extract document ID from the upload URL path
      // uploadURL is already in format: /documents/documents/UUID.extension
      const pathSegments = uploadURL.split('/').filter(Boolean);
      const documentId = pathSegments[pathSegments.length - 1]; // Get the last segment (UUID.extension)
      
      return {
        name: originalName,
        url: uploadURL, // This is the path returned from server
        path: uploadURL, // Use the same path since it's already in correct format
      };
    });
    
    setAttachments(prev => [...prev, ...uploadedFiles]);
    toast({
      title: "Dokumentet u ngarkuan me sukses",
      description: \`\${uploadedFiles.length} dokument(e) u shtuan në çështje\`,
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Court options exactly from CSV
  const firstInstanceCourts = [
    "Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Berat",
    "Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Vlorë", 
    "Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Elbasan",
    "Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Fier",
    "Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Tiranë",
    "Gjykata Administrative e Shkallës së Parë Lushnje",
    "Gjykata Administrative e Shkallës së Parë Tiranë"
  ];

  const appealCourts = [
    "Gjykata e Apelit e Juridiksionit të Përgjithshëm Tiranë",
    "Gjykata Administrative e Apelit Tiranë"
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card className="shadow-lg border border-gray-200">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <CardTitle className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="text-blue-600 mr-2">⚖️</span>
            Regjistro Çështje të Re
          </CardTitle>
          <CardDescription className="text-gray-600">
            Plotësoni formularin për të shtuar një çështje ligjore në sistem (Strukturë bazuar në CSV-në zyrtare)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <ScrollHintContainer 
            direction="vertical" 
            maxHeight="70vh" 
            className="pr-4" 
            data-testid="form-scroll-container"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Basic Case Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Informacion Bazë i Çështjes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="paditesi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-red-600">Paditesi (Emër e Mbiemër) *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Emri dhe mbiemri i paditsit" 
                            {...field} 
                            value={field.value || ""} 
                            required
                            className={field.value && field.value.trim() === "" ? "border-red-500" : ""}
                          />
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
                        <FormLabel className="text-red-600">I Paditur *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="p.sh. Albpetrol SH.A." 
                            {...field} 
                            value={field.value || ""} 
                            required
                            className={field.value && field.value.trim() === "" ? "border-red-500" : ""}
                          />
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
                          placeholder="Përshkrimi i detajuar i objektit të padisë..."
                          className="min-h-[100px]"
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* First Instance Court */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Gjykata e Shkallës së Parë</h3>
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
                            {firstInstanceCourts.map((court) => (
                              <SelectItem key={court} value={court}>{court}</SelectItem>
                            ))}
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
                          <Input placeholder="p.sh. Në shqyrtim, Në vendimmarrje" {...field} value={field.value || ""} />
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
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Appeal Court */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Gjykata e Apelit</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="gjykataApelit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gjykata e Apelit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Zgjidhni gjykatën e apelit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {appealCourts.map((court) => (
                              <SelectItem key={court} value={court}>{court}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fazaGjykataApelit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faza në të cilën ndodhet procesi (Apel)</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. Në pritje të vendimit" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="zhvillimiSeancesApel"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Zhvillimi i seances gjyqesorë data,ora (Apel)</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Current Status and Financial Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Statusi Aktual dhe Informacion Financiar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fazaAktuale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faza në të cilën ndodhet procesi</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. Në shqyrtim, Përfunduar" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="demiIPretenduar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dëmi i Pretenduar në Objekt</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. 1,000,000 ALL" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="shumaGjykata"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shuma e Caktuar nga Gjykata me Vendim</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. 500,000 ALL" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vendimEkzekutim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendim me Ekzekutim të përkohshëm</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. Nr., Date." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fazaEkzekutim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faza në të cilën ndodhet</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. Ekzekutuar" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ankimuar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ankimuar</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. Ankim Nr... dt..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="perfunduar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Përfunduar</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. Vendimi i Formës së Prerë" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gjykataLarte"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gjykata e Lartë</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. Nr. Xxxxxxxxxxx Dt. Xxxxxxxxxxxx" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Document Attachments */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Dokumente të Bashkangjitura</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left side: Square upload area */}
                  <div className="md:col-span-1">
                    <div className="aspect-square">
                      <DocumentUploader
                        maxNumberOfFiles={5}
                        maxFileSize={10485760} // 10MB
                        onComplete={handleUploadComplete}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Mund të bashkangjitnit dokumente PDF ose Word që lidhen me çështjen ligjore
                    </p>
                  </div>
                  
                  {/* Right side: Display uploaded attachments */}
                  <div className="md:col-span-2">
                    {attachments.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">
                          Dokumente të Ngarkuara ({attachments.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {attachments.map((attachment, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <span className="text-sm text-gray-700 truncate" title={attachment.name}>
                                  {attachment.name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(attachment.path, '_blank')}
                                  className="h-8 w-8 p-0"
                                  data-testid={\`download-attachment-\${index}\`}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAttachment(index)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  data-testid={\`remove-attachment-\${index}\`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        Asnjë dokument i ngarkuar ende
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  className="px-8"
                  disabled={createMutation.isPending}
                >
                  Anulo
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="px-8 bg-blue-600 hover:bg-blue-700"
                  data-testid="submit-case"
                >
                  {createMutation.isPending ? "Duke ruajtur..." : "Ruaj Çështjen"}
                </Button>
              </div>
            </form>
          </Form>
          </ScrollHintContainer>
        </CardContent>
      </Card>
    </div>
  );
}
ENTRY_FORM_EOF

echo "✅ case-entry-form.tsx updated"

# Update case-edit-form.tsx  
echo "📝 Updating case-edit-form.tsx..."
cat > client/src/components/case-edit-form.tsx << 'EDIT_FORM_EOF'
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { updateDataEntrySchema, type DataEntry, type UpdateDataEntry } from "@shared/schema";
import { FileText, Download, Trash2 } from "lucide-react";
import { DocumentUploader } from "@/components/DocumentUploader";
import type { UploadResult } from "@uppy/core";

interface CaseEditFormProps {
  caseData: DataEntry;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CaseEditForm({ caseData, onSuccess, onCancel }: CaseEditFormProps) {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; path: string }>>(
    (caseData.attachments as Array<{ name: string; url: string; path: string }>) || []
  );
  
  // Helper function to convert UTC date to datetime-local format for display
  const formatDateTimeLocal = (isoString: string | null) => {
    if (!isoString) return "";
    try {
      // Create a Date object from the ISO string and format for datetime-local
      // This lets the browser handle timezone conversion properly
      const date = new Date(isoString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const result = \`\${year}-\${month}-\${day}T\${hours}:\${minutes}\`;
      console.log(\`Displaying: \${isoString} -> \${result} (browser timezone conversion)\`);
      return result;
    } catch {
      return "";
    }
  };

  const form = useForm<UpdateDataEntry>({
    resolver: zodResolver(updateDataEntrySchema),
    defaultValues: {
      paditesi: caseData.paditesi || "",
      iPaditur: caseData.iPaditur || "",
      personITrete: caseData.personITrete || "",
      objektiIPadise: caseData.objektiIPadise || "",
      gjykataShkalle: caseData.gjykataShkalle || "",
      fazaGjykataShkalle: caseData.fazaGjykataShkalle || "",
      gjykataApelit: caseData.gjykataApelit || "",
      fazaGjykataApelit: caseData.fazaGjykataApelit || "",
      zhvillimiSeancesShkalleI: formatDateTimeLocal(caseData.zhvillimiSeancesShkalleI),
      zhvillimiSeancesApel: formatDateTimeLocal(caseData.zhvillimiSeancesApel),
      fazaAktuale: caseData.fazaAktuale || "",
      perfaqesuesi: caseData.perfaqesuesi || "",
      demiIPretenduar: caseData.demiIPretenduar || "",
      shumaGjykata: caseData.shumaGjykata || "",
      vendimEkzekutim: caseData.vendimEkzekutim || "",
      fazaEkzekutim: caseData.fazaEkzekutim || "",
      ankimuar: caseData.ankimuar || "",
      perfunduar: caseData.perfunduar || "",
      gjykataLarte: caseData.gjykataLarte || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateDataEntry) => {
      const dataWithAttachments = { ...data, attachments };
      return apiRequest(\`/api/data-entries/\${caseData.id}\`, "PUT", dataWithAttachments);
    },
    onSuccess: () => {
      toast({
        title: "Çështja u përditësua",
        description: "Të dhënat e çështjes u ruajtën me sukses",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Gabim në përditësim",
        description: error.message || "Ndodhi një gabim gjatë përditësimit të çështjes",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateDataEntry) => {
    console.log("Form submission data:", data);
    
    // Store datetime exactly as entered (no timezone conversion)
    const convertToUTC = (datetimeLocal: string) => {
      if (!datetimeLocal) return null;
      console.log(\`Storing time exactly as entered: \${datetimeLocal}\`);
      return datetimeLocal; // Store exactly as entered
    };

    const processedData = {
      ...data,
      zhvillimiSeancesShkalleI: convertToUTC(data.zhvillimiSeancesShkalleI || ""),
      zhvillimiSeancesApel: convertToUTC(data.zhvillimiSeancesApel || ""),
    };

    updateMutation.mutate(processedData);
  };


  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    console.log("Upload complete result:", result);
    const uploadedFiles = (result.successful || []).map((file) => {
      const originalName = file.name || 'document';
      const uploadURL = file.uploadURL as string;
      console.log("Processing uploaded file:", { name: originalName, uploadURL });
      
      // Extract document ID from the upload URL path
      // uploadURL is already in format: /documents/documents/UUID.extension
      const pathSegments = uploadURL.split('/').filter(Boolean);
      const documentId = pathSegments[pathSegments.length - 1]; // Get the last segment (UUID.extension)
      
      return {
        name: originalName,
        url: uploadURL, // This is the path returned from server
        path: uploadURL, // Use the same path since it's already in correct format
      };
    });
    
    setAttachments(prev => [...prev, ...uploadedFiles]);
    toast({
      title: "Dokumentet u ngarkuan me sukses",
      description: \`\${uploadedFiles.length} dokument(e) u shtuan në çështje\`,
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Court options exactly from CSV
  const firstInstanceCourts = [
    "Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Berat",
    "Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm VIorë",
    "Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Elbasan",
    "Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Fier",
    "Gjykata e Shkallës së Parë e Juridiksionit të Pergjithshëm Tiranë",
    "Gjykata Administrative e Shkallës së Parë Lushnje",
    "Gjykata Administrative e Shkallës së Parë Tiranë"
  ];

  const appealCourts = [
    "Gjykata e Apelit e Juridiksionit të Përgjithshëm Tiranë",
    "Gjykata Administrative e Apelit Tiranë"
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card className="shadow-lg border border-gray-200">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <CardTitle className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="text-blue-600 mr-2">✏️</span>
            Përditëso Çështjen Ligjore
          </CardTitle>
          <CardDescription className="text-gray-600">
            Përditësoni informacionin e çështjes ligjore në sistem
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Basic Case Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Informacion Bazë i Çështjes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="paditesi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-red-600">Paditesi (Emër e Mbiemër) *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Emri dhe mbiemri i paditsit" 
                            {...field} 
                            value={field.value || ""} 
                            required
                            className={field.value && field.value.trim() === "" ? "border-red-500" : ""}
                          />
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
                        <FormLabel className="text-red-600">I Paditur *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="p.sh. Albpetrol SH.A." 
                            {...field} 
                            value={field.value || ""} 
                            required
                            className={field.value && field.value.trim() === "" ? "border-red-500" : ""}
                          />
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
                          placeholder="Përshkrimi i detajuar i objektit të padisë..."
                          className="min-h-[100px]"
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* First Instance Court */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Gjykata e Shkallës së Parë</h3>
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
                            {firstInstanceCourts.map((court) => (
                              <SelectItem key={court} value={court}>{court}</SelectItem>
                            ))}
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
                          <Input placeholder="p.sh. Në shqyrtim, Në vendimmarrje" {...field} value={field.value || ""} />
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
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Appeal Court */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Gjykata e Apelit</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="gjykataApelit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gjykata e Apelit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Zgjidhni gjykatën e apelit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {appealCourts.map((court) => (
                              <SelectItem key={court} value={court}>{court}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fazaGjykataApelit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faza në të cilën ndodhet procesi (Apel)</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. Në pritje të vendimit" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="zhvillimiSeancesApel"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Zhvillimi i seances gjyqesorë data,ora (Apel)</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Current Status and Financial Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Statusi Aktual dhe Informacion Financiar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fazaAktuale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faza në të cilën ndodhet procesi</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. Në shqyrtim, Përfunduar" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="demiIPretenduar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dëmi i Pretenduar në Objekt</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. 1,000,000 ALL" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="shumaGjykata"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shuma e vendosur nga Gjykata</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. 500,000 ALL" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vendimEkzekutim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendim ekzekutim</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. Po, Jo" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fazaEkzekutim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faza në të cilën ndodhet procesi (Ekzekutim)</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. Në proces" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ankimuar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ankimuar</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. Po, Jo" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="perfunduar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Përfunduar</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. Po, Jo" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gjykataLarte"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gjykata e Lartë</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. Në pritje vendimi" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Document Attachments */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Dokumente të Bashkangjitura</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left side: Square upload area */}
                  <div className="md:col-span-1">
                    <div className="aspect-square">
                      <DocumentUploader
                        maxNumberOfFiles={5}
                        maxFileSize={10485760} // 10MB
                        onComplete={handleUploadComplete}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Mund të bashkangjitnit dokumente PDF ose Word që lidhen me çështjen ligjore
                    </p>
                  </div>

                  {/* Right side: Display uploaded attachments */}
                  <div className="md:col-span-2">
                    {attachments.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">
                          Dokumente të Ngarkuara ({attachments.length})
                        </h4>
                        <div className="space-y-2">
                          {attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                              <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-gray-700">{attachment.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(attachment.path, '_blank')}
                                className="h-8 w-8 p-0"
                                data-testid={\`download-attachment-\${index}\`}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAttachment(index)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                data-testid={\`remove-attachment-\${index}\`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        Asnjë dokument i ngarkuar ende
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={updateMutation.isPending}
                >
                  Anulo
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateMutation.isPending ? "Duke ruajtur..." : "Ruaj Ndryshimet"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
EDIT_FORM_EOF

echo "✅ case-edit-form.tsx updated"

# Rebuild the application
echo "🔨 Rebuilding application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build completed successfully"

# Restart PM2 with all environment variables
echo "🔄 Restarting PM2..."
pm2 delete albpetrol-legal 2>/dev/null || true

NODE_ENV=production \
PORT=5000 \
DATABASE_URL="postgresql://albpetrol_user:SecurePass2025@localhost:5432/albpetrol_legal_db" \
SMTP_HOST="smtp-mail.outlook.com" \
SMTP_PORT=587 \
SMTP_USER="it.system@albpetrol.al" \
SMTP_PASS="Albpetrol2025" \
SMTP_FROM="it.system@albpetrol.al" \
EMAIL_FROM="it.system@albpetrol.al" \
TZ="Europe/Tirane" \
pm2 start dist/index.js --name albpetrol-legal

if [ $? -ne 0 ]; then
  echo "❌ PM2 start failed!"
  exit 1
fi

# Save PM2 configuration
pm2 save

echo ""
echo "=================================="
echo "✅ Deployment Complete!"
echo "=================================="
echo ""
echo "Changes applied:"
echo "  ✅ Attachment window moved to LEFT side"
echo "  ✅ Square shape with aspect-square CSS"
echo "  ✅ Files display on RIGHT side"
echo "  ✅ Inside scrollable form area"
echo ""
echo "Application running at: https://legal.albpetrol.al"
echo ""
echo "PM2 Status:"
pm2 status
echo ""
