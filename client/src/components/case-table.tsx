import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CaseEditForm } from "@/components/case-edit-form";
import type { DataEntry } from "@shared/schema";

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
  } = useQuery<{
    entries: (DataEntry & { createdByName: string })[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }>({
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

  const handleDelete = (id: number) => {
    if (window.confirm("A jeni i sigurt që dëshironi të fshini këtë çështje?")) {
      deleteMutation.mutate(id);
    }
  };

  // Helper function to check if user can edit/delete an entry
  const canUserModifyEntry = (entry: DataEntry & { createdByName: string }) => {
    return user?.role === "admin" || entry.createdById === user?.id;
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
                  placeholder="Kërkoni në të gjitha fushat (paditesi, i paditur, gjykata, etj.)..."
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
                  {response ? `${response.pagination?.totalItems || 0} çështje në total` : ""}
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
                        <TableHead className="min-w-[120px]">Person i Tretë</TableHead>
                        <TableHead className="min-w-[200px]">Objekti i Padisë</TableHead>
                        <TableHead className="min-w-[150px]">Gjykata Shkallë së Parë e</TableHead>
                        <TableHead className="min-w-[180px]">Faza Shkallë I</TableHead>
                        <TableHead className="min-w-[150px]">Gjykata Apelit</TableHead>
                        <TableHead className="min-w-[180px]">Faza Apelit</TableHead>
                        <TableHead className="min-w-[150px]">Faza në të cilën ndodhet proçesi</TableHead>
                        <TableHead className="min-w-[150px]">Përfaqësuesi</TableHead>
                        <TableHead className="min-w-[150px]">Demi i Pretenduar</TableHead>
                        <TableHead className="min-w-[150px]">Shuma Gjykate</TableHead>
                        <TableHead className="min-w-[180px]">Vendim Ekzekutim</TableHead>
                        <TableHead className="min-w-[150px]">Faza Ekzekutim</TableHead>

                        <TableHead className="min-w-[150px]">Gjykata e Lartë</TableHead>
                        <TableHead className="min-w-[120px]">Krijuar më</TableHead>
                        <TableHead className="min-w-[120px]">Krijuar nga</TableHead>
                        {(user?.role === "admin" || response?.entries?.some(entry => entry.createdById === user?.id)) && <TableHead className="min-w-[120px]">Veprime</TableHead>}
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

                          <TableCell className="max-w-[150px] truncate">{caseItem.gjykataLarte || "-"}</TableCell>
                          <TableCell>{formatDate(caseItem.createdAt ? new Date(caseItem.createdAt).toISOString() : null)}</TableCell>
                          <TableCell className="max-w-[120px] truncate">{caseItem.createdByName || "Përdorues i panjohur"}</TableCell>
                          {canUserModifyEntry(caseItem) && (
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingCase(caseItem)}
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
                      Faqja {response.pagination.currentPage} nga {response.pagination.totalPages}
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

        {/* Edit Modal */}
        <Dialog open={!!editingCase} onOpenChange={(open) => !open && setEditingCase(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifiko Çështjen</DialogTitle>
            </DialogHeader>
            {editingCase && (
              <CaseEditForm 
                caseData={editingCase} 
                onSuccess={() => {
                  setEditingCase(null);
                  queryClient.invalidateQueries({ queryKey: ["/api/data-entries"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-entries"] });
                }}
                onCancel={() => setEditingCase(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}