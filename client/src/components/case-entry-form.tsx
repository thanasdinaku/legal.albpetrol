
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { insertDataEntrySchema, type InsertDataEntry } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

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
      gjykataLarte: "",
      fazaAktuale: "",
      perfaqesuesi: "",
      demiIPretenduar: "",
      shumaGjykata: "",
      vendimEkzekutim: "",
      fazaEkzekutim: "",
      shenim: "",
      nrVendimit: "",
      nrRegjistrimit: "",
      nrSeances: ""
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertDataEntry) => apiRequest("/api/data-entries", {
      method: "POST",
      body: data
    }),
    onSuccess: () => {
      toast({
        title: "Sukses",
        description: "Çështja u regjistrua me sukses!"
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/data-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Gabim",
        description: "Ndodhi një gabim gjatë regjistrimit të çështjes.",
        variant: "destructive"
      });
      console.error("Error creating entry:", error);
    }
  });

  const onSubmit = (data: InsertDataEntry) => {
    createMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-blue-800">Regjistro Çështje të Re</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="paditesi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paditësi *</FormLabel>
                    <FormControl>
                      <Input placeholder="Emri i paditësit" {...field} />
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
                    <FormLabel>I Paditur *</FormLabel>
                    <FormControl>
                      <Input placeholder="Emri i të paditurit" {...field} />
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
                      <Input placeholder="Emri i personit të tretë" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="objektiIPadise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objekti i Padisë</FormLabel>
                    <FormControl>
                      <Input placeholder="Objekti i padisë" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gjykataShkalle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gjykata Shkallë</FormLabel>
                    <FormControl>
                      <Input placeholder="Emri i gjykatës shkallë" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fazaGjykataShkalle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faza Gjykata Shkallë</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Zgjidhni fazën" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ne pritje">Në pritje</SelectItem>
                        <SelectItem value="Ne process">Në proces</SelectItem>
                        <SelectItem value="E perfunduar">E përfunduar</SelectItem>
                        <SelectItem value="E pezulluar">E pezulluar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gjykataApelit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gjykata Apelit</FormLabel>
                    <FormControl>
                      <Input placeholder="Emri i gjykatës së apelit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fazaGjykataApelit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faza Gjykata Apelit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Zgjidhni fazën" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ne pritje">Në pritje</SelectItem>
                        <SelectItem value="Ne process">Në proces</SelectItem>
                        <SelectItem value="E perfunduar">E përfunduar</SelectItem>
                        <SelectItem value="E pezulluar">E pezulluar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gjykataLarte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gjykata Lartë</FormLabel>
                    <FormControl>
                      <Input placeholder="Emri i gjykatës lartë" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fazaAktuale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faza Aktuale</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Zgjidhni fazën aktuale" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Gjykata Shkalle">Gjykata Shkallë</SelectItem>
                        <SelectItem value="Gjykata Apelit">Gjykata Apelit</SelectItem>
                        <SelectItem value="Gjykata Larte">Gjykata Lartë</SelectItem>
                        <SelectItem value="Ekzekutim">Ekzekutim</SelectItem>
                        <SelectItem value="E mbyllur">E mbyllur</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Input placeholder="Emri i përfaqësuesit" {...field} />
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
                    <FormLabel>Dëmi i Pretenduar</FormLabel>
                    <FormControl>
                      <Input placeholder="Shuma e dëmit të pretenduar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shumaGjykata"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shuma Gjykata</FormLabel>
                    <FormControl>
                      <Input placeholder="Shuma e vendosur nga gjykata" {...field} />
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
                    <FormLabel>Vendim Ekzekutim</FormLabel>
                    <FormControl>
                      <Input placeholder="Vendimi për ekzekutim" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fazaEkzekutim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faza Ekzekutim</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Zgjidhni fazën e ekzekutimit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ne pritje">Në pritje</SelectItem>
                        <SelectItem value="Ne proces">Në proces</SelectItem>
                        <SelectItem value="E perfunduar">E përfunduar</SelectItem>
                        <SelectItem value="E pezulluar">E pezulluar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nrVendimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numri i Vendimit</FormLabel>
                    <FormControl>
                      <Input placeholder="Numri i vendimit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nrRegjistrimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numri i Regjistrimit</FormLabel>
                    <FormControl>
                      <Input placeholder="Numri i regjistrimit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nrSeances"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numri i Seancave</FormLabel>
                    <FormControl>
                      <Input placeholder="Numri i seancave" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="shenim"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shënime</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Shënime shtesë..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-6">
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-submit"
              >
                {createMutation.isPending ? "Duke regjistruar..." : "Regjistro Çështjen"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => form.reset()}
                data-testid="button-reset"
              >
                Pastro Formën
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}