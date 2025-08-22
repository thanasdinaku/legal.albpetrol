import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
  
  // Helper function to convert UTC date to datetime-local format for Albania timezone
  const formatDateTimeLocal = (isoString: string | null) => {
    if (!isoString) return "";
    try {
      const utcDate = new Date(isoString);
      // Add 1 hour to convert from UTC to Albania time (GMT+1) for display
      const albaniaTime = new Date(utcDate.getTime() + (1 * 60 * 60 * 1000));
      // Format as datetime-local string
      return albaniaTime.toISOString().slice(0, 16);
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
      return apiRequest(`/api/data-entries/${caseData.id}`, "PUT", dataWithAttachments);
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
    
    // Convert datetime-local values to UTC for storage
    const convertToUTC = (datetimeLocal: string) => {
      if (!datetimeLocal) return null;
      try {
        // datetime-local gives us a string like "2025-08-23T17:42"
        // User entered this as Albania time, convert to UTC by subtracting 1 hour
        const albaniaTime = new Date(datetimeLocal);
        const utcTime = new Date(albaniaTime.getTime() - (1 * 60 * 60 * 1000));
        console.log(`Converting ${datetimeLocal} (Albania time) -> ${utcTime.toISOString()} (UTC)`);
        return utcTime.toISOString();
      } catch {
        return null;
      }
    };

    const processedData = {
      ...data,
      zhvillimiSeancesShkalleI: convertToUTC(data.zhvillimiSeancesShkalleI || ""),
      zhvillimiSeancesApel: convertToUTC(data.zhvillimiSeancesApel || ""),
    };

    console.log("Submitting case data:", processedData);
    updateMutation.mutate(processedData);
  };

  // Document upload handlers
  const handleGetUploadParameters = async () => {
    const response = await apiRequest("/api/documents/upload", "POST");
    const data = await response.json();
    return { method: "PUT" as const, url: data.uploadURL };
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
      description: `${uploadedFiles.length} dokument(e) u shtuan në çështje`,
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const courtOptions = [
    "Gjykata e Shkallës së Parë e Rrethit Gjyqësor Vlorë",
    "Gjykata e Shkallës së Parë e Rrethit Gjyqësor Berat",
    "Gjykata e Shkallës së Parë e Rrethit Gjyqësor Fier",
    "Gjykata e Shkallës së Parë Administrative Lushnjë",
    "Gjykata e Shkallës së Parë Administrative Tiranë",
    "Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Tiranë"
  ];

  const appellateCourtOptions = [
    "Gjykata e Apelit Administrative Tiranë",
    "Gjykata e Apelit e Juridiksionit të Përgjithshëm Tiranë"
  ];

  const supremeCourtOptions = [
    "Gjykata e Lartë e Republikës së Shqipërisë"
  ];

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Paditesi */}
            <FormField
              control={form.control}
              name="paditesi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paditesi (Emër e Mbiemër) *</FormLabel>
                  <FormControl>
                    <Input placeholder="Emri i plotë i paditesit" {...field} value={field.value || ""} />
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
                  <FormLabel>I Paditur *</FormLabel>
                  <FormControl>
                    <Input placeholder="Emri i plotë i të paditurit" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Person I Trete */}
            <FormField
              control={form.control}
              name="personITrete"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person i Tretë</FormLabel>
                  <FormControl>
                    <Input placeholder="Nëse ka person të tretë të përfshirë" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Objekti I Padise */}
            <FormField
              control={form.control}
              name="objektiIPadise"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Objekti i Padisë</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Përshkrimi i objektit të padisë..." {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Gjykata Shkalle */}
            <FormField
              control={form.control}
              name="gjykataShkalle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gjykata Shkallë së Parë e</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Zgjidhni gjykatën e shkallës së parë" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courtOptions.map((court) => (
                        <SelectItem key={court} value={court}>
                          {court}
                        </SelectItem>
                      ))}
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
                  <FormLabel>Faza Shkallë I</FormLabel>
                  <FormControl>
                    <Input placeholder="P.Sh. Në gjykim" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Gjykata Apelit */}
            <FormField
              control={form.control}
              name="gjykataApelit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gjykata Apelit</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Zgjidhni gjykatën e apelit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {appellateCourtOptions.map((court) => (
                        <SelectItem key={court} value={court}>
                          {court}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <FormLabel>Faza Apelit</FormLabel>
                  <FormControl>
                    <Input placeholder="P.Sh. Në shqyrtim" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Zhvillimi Seances Shkalle I */}
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

            {/* Zhvillimi Seances Apel */}
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

            {/* Faza Aktuale */}
            <FormField
              control={form.control}
              name="fazaAktuale"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Faza në të cilën ndodhet proçesi</FormLabel>
                  <FormControl>
                    <Input placeholder="P.Sh. Në gjykim pranë shkallës së parë" {...field} value={field.value || ""} />
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
                  <FormLabel>Përfaqësuesi I Albpetrol SH.A.</FormLabel>
                  <FormControl>
                    <Input placeholder="Emri i përfaqësuesit ligjor" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Demi I Pretenduar */}
            <FormField
              control={form.control}
              name="demiIPretenduar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dëmi i Pretenduar në Objekt</FormLabel>
                  <FormControl>
                    <Input placeholder="P.Sh. 50,000 LEKË" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Shuma Gjykata */}
            <FormField
              control={form.control}
              name="shumaGjykata"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shuma e Caktuar nga Gjykata me Vendim</FormLabel>
                  <FormControl>
                    <Input placeholder="P.Sh. 30,000 LEKË" {...field} value={field.value || ""} />
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
                    <Input placeholder="P.Sh. Po, vendim nr. 123/2024" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Faza Ekzekutim */}
            <FormField
              control={form.control}
              name="fazaEkzekutim"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Faza në të cilën ndodhet Ekzekutimi</FormLabel>
                  <FormControl>
                    <Input placeholder="P.Sh. Në proçes" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ankimuar */}
            <FormField
              control={form.control}
              name="ankimuar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ankimuar</FormLabel>
                  <FormControl>
                    <Input placeholder="P.Sh. Po, në proces apeli" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Perfunduar */}
            <FormField
              control={form.control}
              name="perfunduar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Përfunduar</FormLabel>
                  <FormControl>
                    <Input placeholder="P.Sh. Po, me vendim përfundimtar" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Gjykata Larte */}
            <FormField
              control={form.control}
              name="gjykataLarte"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gjykata e Lartë</FormLabel>
                  <FormControl>
                    <Input placeholder="P.Sh. Po, në proces" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Document Attachments */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h4 className="text-md font-semibold text-gray-800">Dokumente të Bashkangjitura</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Mund të bashkangjitnit dokumente PDF ose Word që lidhen me çështjen ligjore
                </p>
                <DocumentUploader
                  maxNumberOfFiles={5}
                  maxFileSize={10485760} // 10MB
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                />
              </div>
              
              {/* Display uploaded attachments */}
              {attachments.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">
                    Dokumente të Ngarkuara ({attachments.length})
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                            data-testid={`download-attachment-${index}`}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`remove-attachment-${index}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
            >
              {updateMutation.isPending ? "Duke ruajtur..." : "Ruaj Ndryshimet"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}