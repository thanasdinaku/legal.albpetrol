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

interface CaseEditFormProps {
  caseData: DataEntry;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CaseEditForm({ caseData, onSuccess, onCancel }: CaseEditFormProps) {
  const { toast } = useToast();
  
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
      fazaAktuale: caseData.fazaAktuale || "",
      perfaqesuesi: caseData.perfaqesuesi || "",
      demiIPretenduar: caseData.demiIPretenduar || "",
      shumaGjykata: caseData.shumaGjykata || "",
      vendimEkzekutim: caseData.vendimEkzekutim || "",
      fazaEkzekutim: caseData.fazaEkzekutim || "",
      gjykataLarte: caseData.gjykataLarte || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateDataEntry) => {
      return apiRequest(`/api/data-entries/${caseData.id}`, "PUT", data);
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
    updateMutation.mutate(data);
  };

  const courtOptions = [
    "Gjykata e Shkallës së Parë Tiranë",
    "Gjykata e Shkallës së Parë Durrës",
    "Gjykata e Shkallës së Parë Fier",
    "Gjykata e Shkallës së Parë Korçë",
    "Gjykata e Shkallës së Parë Shkodër",
    "Gjykata e Shkallës së Parë Vlorë",
    "Gjykata e Shkallës së Parë Lezhë",
    "Gjykata e Shkallës së Parë Kukës",
    "Gjykata e Shkallës së Parë Dibër",
    "Gjykata e Shkallës së Parë Elbasan",
    "Gjykata e Shkallës së Parë Berat",
    "Gjykata e Shkallës së Parë Gjirokastër"
  ];

  const appellateCourtOptions = [
    "Gjykata e Apelit Tiranë",
    "Gjykata e Apelit Durrës", 
    "Gjykata e Apelit Korçë",
    "Gjykata e Apelit Shkodër",
    "Gjykata e Apelit Vlorë"
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

            {/* Gjykata Larte */}
            <FormField
              control={form.control}
              name="gjykataLarte"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gjykata e Lartë</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Zgjidhni gjykatën e lartë" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {supremeCourtOptions.map((court) => (
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