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
      const response = await apiRequest("/api/data-entries", "POST", data);
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
          title: "Sesioni ka skaduar",
          description: "Ju lutem kyçuni përsëri në sistem",
          variant: "destructive",
        });
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = "/auth";
        }, 2000);
      } else {
        toast({
          title: "Gabim në shtimin e çështjes",
          description: error.message || "Ndodhi një gabim gjatë regjistrimit të çështjes",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Regjistro Çështje të Re</h1>
          <p className="text-gray-600 mt-2">
            Plotësoni informacionet e çështjes ligjore
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Të Dhënat e Çështjes</CardTitle>
            <CardDescription>
              Fushat me * janë të detyrueshme
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                </div>

                {/* Objekti I Padise */}
                <FormField
                  control={form.control}
                  name="objektiIPadise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objekti i Padisë</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Përshkrimi i objektit të padisë" 
                          className="min-h-[80px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gjykata e Shkallës së Parë e */}
                  <FormField
                    control={form.control}
                    name="gjykataShkalle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gjykata e Shkallës së Parë</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="text-gray-900 [&[data-placeholder]]:text-gray-400">
                              <SelectValue placeholder="Zgjidhni gjykatën" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Vlore">Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Vlore</SelectItem>
                            <SelectItem value="Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Berat">Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Berat</SelectItem>
                            <SelectItem value="Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Elbasan">Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Elbasan</SelectItem>
                            <SelectItem value="Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Fier">Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Fier</SelectItem>
                            <SelectItem value="Gjykata e Shkallës së Parë Administrative Lushnjë">Gjykata e Shkallës së Parë Administrative Lushnjë</SelectItem>
                            <SelectItem value="Gjykata e Shkallës së Parë Administrative Tiranë">Gjykata e Shkallës së Parë Administrative Tiranë</SelectItem>
                            <SelectItem value="Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Tiranë">Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Tiranë</SelectItem>
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
                                const timeValue = e.target.value; // "HH:mm" format
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
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="text-gray-900 [&[data-placeholder]]:text-gray-400">
                              <SelectValue placeholder="Zgjidhni gjykatën e apelit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Gjykata e Apelit Administrative Tiranë">Gjykata e Apelit Administrative Tiranë</SelectItem>
                            <SelectItem value="Gjykata e Apelit e Juridiksionit të Përgjithshëm Tiranë">Gjykata e Apelit e Juridiksionit të Përgjithshëm Tiranë</SelectItem>
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
                        <FormLabel>Faza në të cilën ndodhet procesi (Apel)</FormLabel>
                        <FormControl>
                          <Input placeholder="p.sh. Në pritje të shqyrtimit" {...field} value={field.value || ""} />
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
                      <FormItem>
                        <FormLabel>Faza në të cilën ndodhet proçesi</FormLabel>
                        <FormControl>
                          <Input placeholder="P.Sh. (Përgaditore)" {...field} value={field.value || ""} />
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
                          <Input placeholder="Emri i përfaqësuesit ligjor" {...field} value={field.value || ""} />
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
                          <Input placeholder="P.Sh. 50,000 LEKË" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Shuma e Gjykates */}
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
                          <Input placeholder="Detaje të vendimit" {...field} value={field.value || ""} />
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



                  {/* Gjykata e Larte */}
                  <FormField
                    control={form.control}
                    name="gjykataLarte"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gjykata e Lartë</FormLabel>
                        <FormControl>
                          <Input placeholder="Nëse ka shkuar në Gjykatën e Lartë" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    disabled={createMutation.isPending}
                  >
                    Pastro Formën
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Duke ruajtur..." : "Ruaj Çështjen"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}