import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { DataEntry } from "@shared/schema";
import { updateDataEntrySchema } from "@shared/schema";
import { z } from "zod";

type UpdateFormData = z.infer<typeof updateDataEntrySchema>;

// Define the expected API response structure
interface DataEntriesResponse {
  entries: DataEntry[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

export default function CaseTable() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [editingCase, setEditingCase] = useState<DataEntry | null>(null);

  const {
    data: response,
    isLoading,
    error,
  } = useQuery<DataEntriesResponse>({
    queryKey: ["/api/data-entries", { 
      page: currentPage, 
      search: searchTerm
    }],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/data-entries/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Çështja u fshi",
        description: "Çështja u largua me sukses nga baza e të dhënave",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/data-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-entries"] });
    },
    onError: (error: any) => {
      toast({
        title: "Gabim në fshirjen e çështjes",
        description: error.message || "Ndodhi një gabim gjatë fshirjes së çështjes",
        variant: "destructive",
      });
    },
  });

  const editForm = useForm<UpdateFormData>({
    resolver: zodResolver(updateDataEntrySchema),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateFormData }) => {
      return apiRequest(`/api/data-entries/${id}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Çështja u përditësua",
        description: "Çështja u përditësua me sukses në bazën e të dhënave",
      });
      setEditingCase(null);
      editForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/data-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-entries"] });
    },
    onError: (error: any) => {
      toast({
        title: "Gabim në përditësimin e çështjes",
        description: error.message || "Ndodhi një gabim gjatë përditësimit të çështjes",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm("A jeni i sigurt që dëshironi të fshini këtë çështje?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (caseItem: DataEntry) => {
    if (user?.role !== 'admin') {
      toast({
        title: "Aksesi i kufizuar",
        description: "Vetëm administratorët mund të përditësojnë çështjet ekzistuese.",
        variant: "destructive",
      });
      return;
    }
    setEditingCase(caseItem);
    editForm.reset({
      paditesi: caseItem.paditesi || "",
      iPaditur: caseItem.iPaditur || "",
      personITrete: caseItem.personITrete || "",
      objektiIPadise: caseItem.objektiIPadise || "",
      gjykataShkalle: caseItem.gjykataShkalle || "",
      fazaGjykataShkalle: caseItem.fazaGjykataShkalle || "",
      gjykataApelit: caseItem.gjykataApelit || "",
      fazaGjykataApelit: caseItem.fazaGjykataApelit || "",
      fazaAktuale: caseItem.fazaAktuale || "",
      perfaqesuesi: caseItem.perfaqesuesi || "",
      demiIPretenduar: caseItem.demiIPretenduar || "",
      shumaGjykata: caseItem.shumaGjykata || "",
      vendimEkzekutim: caseItem.vendimEkzekutim || "",
      fazaEkzekutim: caseItem.fazaEkzekutim || "",
      ankimuar: caseItem.ankimuar || "Jo",
      perfunduar: caseItem.perfunduar || "Jo",
      gjykataLarte: caseItem.gjykataLarte || "",
    });
  };

  const onEditSubmit = (data: UpdateFormData) => {
    if (editingCase) {
      updateMutation.mutate({ id: editingCase.id, data });
    }
  };

  const handleExport = async (format: 'excel' | 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/data-entries/export/${format}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      const timestamp = new Date().toISOString().slice(0, 10);
      const extension = format === 'excel' ? 'xlsx' : format;
      a.download = `ceshtjet-ligjore-${timestamp}.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Eksportimi u krye me sukses",
        description: `Skedari ${format.toUpperCase()} u shkarkua në kompjuterin tuaj`,
      });
    } catch (error) {
      toast({
        title: "Gabim në eksportim",
        description: "Ndodhi një gabim gjatë eksportimit të të dhënave",
        variant: "destructive",
      });
    }
  };



  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("sq-AL");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Gabim në ngarkimin e të dhënave</h3>
                <p className="text-gray-500">{(error as any)?.message || "Ndodhi një gabim"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Menaxhimi i Çështjeve Ligjore</h1>
          <p className="text-gray-600 mt-2">
            Shikoni dhe menaxhoni të gjitha çështjet e regjistruara
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtrat</CardTitle>
            <CardDescription>Përdorni filtrat për të kërkuar çështje specifike</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Kërko sipas emrit, paditesit, të paditurit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Button
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                variant="outline"
              >
                Pastro Filtrin
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Çështjet Ligjore</CardTitle>
                <CardDescription>
                  {response ? `${response.pagination?.total || 0} çështje në total` : ""}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('excel')}
                  disabled={!response?.entries?.length}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                  disabled={!response?.entries?.length}
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  disabled={!response?.entries?.length}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-4"></div>
                  <p className="text-gray-500">Po ngarkohen të dhënat...</p>
                </div>
              </div>
            ) : !response?.entries?.length ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nuk u gjetën çështje</h3>
                  <p className="text-gray-500">Nuk ka çështje të regjistruara aktualisht</p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[80px]">Nr. Rendor</TableHead>
                        <TableHead className="min-w-[150px]">Paditesi</TableHead>
                        <TableHead className="min-w-[150px]">I Paditur</TableHead>
                        <TableHead className="min-w-[120px]">Person I Tretë</TableHead>
                        <TableHead className="min-w-[200px]">Objekti i Padisë</TableHead>
                        <TableHead className="min-w-[150px]">Gjykata Shkallë I</TableHead>
                        <TableHead className="min-w-[180px]">Faza Shkallë I</TableHead>
                        <TableHead className="min-w-[150px]">Gjykata Apelit</TableHead>
                        <TableHead className="min-w-[180px]">Faza Apelit</TableHead>
                        <TableHead className="min-w-[150px]">Faza Aktuale</TableHead>
                        <TableHead className="min-w-[150px]">Përfaqësuesi</TableHead>
                        <TableHead className="min-w-[150px]">Demi i Pretenduar</TableHead>
                        <TableHead className="min-w-[150px]">Shuma Gjykate</TableHead>
                        <TableHead className="min-w-[180px]">Vendim Ekzekutim</TableHead>
                        <TableHead className="min-w-[150px]">Faza Ekzekutim</TableHead>
                        <TableHead className="min-w-[100px]">Ankimuar</TableHead>
                        <TableHead className="min-w-[100px]">Përfunduar</TableHead>
                        <TableHead className="min-w-[150px]">Gjykata e Lartë</TableHead>
                        <TableHead className="min-w-[120px]">Krijuar më</TableHead>
                        {user?.role === "admin" && <TableHead className="min-w-[120px]">Veprime</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {response.entries.map((caseItem: DataEntry) => (
                        <TableRow key={caseItem.id}>
                          <TableCell className="font-medium">{caseItem.id}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.paditesi}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.iPaditur}</TableCell>
                          <TableCell className="max-w-[120px] truncate">{caseItem.personITrete || "-"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {caseItem.objektiIPadise || "-"}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.gjykataShkalle || "-"}</TableCell>
                          <TableCell className="max-w-[180px] truncate">{caseItem.fazaGjykataShkalle || "-"}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.gjykataApelit || "-"}</TableCell>
                          <TableCell className="max-w-[180px] truncate">{caseItem.fazaGjykataApelit || "-"}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.fazaAktuale || "-"}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.perfaqesuesi || "-"}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.demiIPretenduar || "-"}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.shumaGjykata || "-"}</TableCell>
                          <TableCell className="max-w-[180px] truncate">{caseItem.vendimEkzekutim || "-"}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.fazaEkzekutim || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={caseItem.ankimuar === "Po" ? "destructive" : "secondary"}>
                              {caseItem.ankimuar}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={caseItem.perfunduar === "Po" ? "default" : "outline"}>
                              {caseItem.perfunduar}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.gjykataLarte || "-"}</TableCell>
                          <TableCell>{formatDate(caseItem.createdAt as string)}</TableCell>
                          {user?.role === "admin" && (
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(caseItem)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(caseItem.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {response.pagination && response.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-500">
                      Faqja {response.pagination.page} nga {response.pagination.totalPages}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        E mëparshme
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage >= (response.pagination?.totalPages || 1)}
                      >
                        E rradhës
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingCase} onOpenChange={() => setEditingCase(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Përditëso Çështjen Ligjore</DialogTitle>
              <DialogDescription>
                Përditësoni të dhënat e çështjes ligjore. Vetëm administratorët mund të kryejnë këtë veprim.
              </DialogDescription>
            </DialogHeader>
            
            {editingCase && (
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Informacioni Bazë</h3>
                      
                      <FormField
                        control={editForm.control}
                        name="paditesi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Paditesi *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="iPaditur"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>I Paditur *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="personITrete"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Person i Tretë</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="objektiIPadise"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Objekti i Padisë</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="gjykataShkalle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gjykata Shkallë I</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="fazaGjykataShkalle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Faza Gjykata Shkallë I</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="gjykataApelit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gjykata e Apelit</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="fazaGjykataApelit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Faza Gjykata e Apelit</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="fazaAktuale"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Faza Aktuale</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Detaje Shtesë</h3>
                      
                      <FormField
                        control={editForm.control}
                        name="perfaqesuesi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Përfaqësuesi</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="demiIPretenduar"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Demi i Pretenduar</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="shumaGjykata"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shuma e Gjykatës</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="vendimEkzekutim"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vendim Ekzekutim</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="fazaEkzekutim"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Faza e Ekzekutimit</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="gjykataLarte"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gjykata e Lartë</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={editForm.control}
                          name="ankimuar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ankimuar</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Zgjidh" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Po">Po</SelectItem>
                                  <SelectItem value="Jo">Jo</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={editForm.control}
                          name="perfunduar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Përfunduar</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Zgjidh" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Po">Po</SelectItem>
                                  <SelectItem value="Jo">Jo</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditingCase(null)}
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
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}