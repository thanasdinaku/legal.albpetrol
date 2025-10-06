import { useState, useEffect, useMemo } from "react";
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
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, Download, FileSpreadsheet, ArrowUpDown, SortAsc, SortDesc, Eye, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CaseEditForm } from "@/components/case-edit-form";
import { formatDateTime, formatDate } from "@/lib/dateUtils";
import { ScrollHintContainer } from "@/components/ui/scroll-hint-container";
import type { DataEntry } from "@shared/schema";

// Custom hook for debounced search
function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function CaseTable() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [editingCase, setEditingCase] = useState<DataEntry | null>(null);
  const [viewingCase, setViewingCase] = useState<DataEntry | null>(null);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounced(searchTerm, 500);

  // Memoized query key to ensure proper cache invalidation
  const queryKey = useMemo(() => [
    "/api/data-entries", 
    { 
      page: currentPage, 
      limit: 10,
      search: debouncedSearchTerm || undefined,
      sortOrder: sortOrder
    }
  ], [currentPage, debouncedSearchTerm, sortOrder]);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery<{
    entries: (DataEntry & { createdByName: string; nrRendor: number })[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }>({
    queryKey,
    retry: false,
    staleTime: 0, // Always fresh for search/sort
    gcTime: 1 * 60 * 1000, // 1 minute
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

  const canUserDeleteEntry = () => {
    return user?.role === "admin";
  };

  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      // Build query parameters to match current view
      const params = new URLSearchParams();
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      params.append('sortOrder', sortOrder);
      
      const queryString = params.toString();
      const exportUrl = `/api/data-entries/export/${format}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(exportUrl, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      
      const timestamp = new Date().toISOString().slice(0, 10);
      const extension = format === 'excel' ? 'xlsx' : format;
      a.download = `ceshtjet-ligjore-${timestamp}.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
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

  const handleSort = (order: 'desc' | 'asc') => {
    setSortOrder(order);
    setCurrentPage(1); // Reset to first page when sorting changes
    // Force refresh by invalidating cache
    queryClient.invalidateQueries({ queryKey: ["/api/data-entries"] });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when search changes
    // Force refresh by invalidating cache
    queryClient.invalidateQueries({ queryKey: ["/api/data-entries"] });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, sortOrder]);

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
                <Button 
                  onClick={() => refetch()} 
                  className="mt-4"
                  variant="outline"
                >
                  Provo Përsëri
                </Button>
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
            <CardTitle>Filtrat dhe Kërkimi</CardTitle>
            <CardDescription>Përdorni filtrat për të kërkuar çështje specifike</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Kërkoni në të gjitha fushat (paditesi, i paditur, gjykata, etj.)..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-cases"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  variant={sortOrder === 'desc' ? 'default' : 'outline'}
                  onClick={() => handleSort('desc')}
                  className="flex-1"
                  data-testid="button-sort-newest"
                >
                  <SortDesc className="h-4 w-4 mr-2" />
                  Më të Rejat
                </Button>
                <Button
                  variant={sortOrder === 'asc' ? 'default' : 'outline'}
                  onClick={() => handleSort('asc')}
                  className="flex-1"
                  data-testid="button-sort-oldest"
                >
                  <SortAsc className="h-4 w-4 mr-2" />
                  Më të Vjetrat
                </Button>
              </div>

              <Button
                onClick={clearFilters}
                variant="outline"
                data-testid="button-clear-filters"
              >
                Pastro Filtrat
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
                  {debouncedSearchTerm && ` (duke kërkuar: "${debouncedSearchTerm}")`}
                  {sortOrder === 'desc' ? ' - Radhitur nga më të rejat' : ' - Radhitur nga më të vjetrat'}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Export buttons */}
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('excel')}
                    disabled={!response?.entries?.length}
                    data-testid="button-export-excel"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('csv')}
                    disabled={!response?.entries?.length}
                    data-testid="button-export-csv"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                </div>
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {debouncedSearchTerm ? 'Nuk u gjetën rezultate' : 'Nuk u gjetën çështje'}
                  </h3>
                  <p className="text-gray-500">
                    {debouncedSearchTerm 
                      ? `Nuk ka çështje që përputhen me "${debouncedSearchTerm}"`
                      : 'Nuk ka çështje të regjistruara aktualisht'
                    }
                  </p>
                  {debouncedSearchTerm && (
                    <Button 
                      onClick={clearFilters} 
                      className="mt-4"
                      variant="outline"
                    >
                      Pastro Kërkimin
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <ScrollHintContainer 
                  direction="horizontal" 
                  className="border rounded-lg" 
                  data-testid="table-scroll-container"
                >
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
                        <TableHead className="min-w-[180px]">Zhvillimi i seances gjyqesorë (Shkallë I)</TableHead>
                        <TableHead className="min-w-[150px]">Gjykata Apelit</TableHead>
                        <TableHead className="min-w-[180px]">Faza Apelit</TableHead>
                        <TableHead className="min-w-[180px]">Zhvillimi i seances gjyqesorë (Apel)</TableHead>
                        <TableHead className="min-w-[150px]">Faza në të cilën ndodhet proçesi</TableHead>
                        <TableHead className="min-w-[150px]">Përfaqësuesi</TableHead>
                        <TableHead className="min-w-[150px]">Demi i Pretenduar</TableHead>
                        <TableHead className="min-w-[150px]">Shuma Gjykate</TableHead>
                        <TableHead className="min-w-[180px]">Vendim Ekzekutim</TableHead>
                        <TableHead className="min-w-[150px]">Faza Ekzekutim</TableHead>

                        <TableHead className="min-w-[150px]">Gjykata e Lartë</TableHead>
                        <TableHead className="min-w-[120px]">Krijuar më</TableHead>
                        <TableHead className="min-w-[120px]">Krijuar nga</TableHead>
                        <TableHead className="min-w-[120px]">Veprime</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {response.entries.map((caseItem: DataEntry & { createdByName: string; nrRendor: number }) => (
                        <TableRow key={caseItem.id}>
                          <TableCell className="font-medium">{caseItem.nrRendor}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.paditesi}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.iPaditur}</TableCell>
                          <TableCell className="max-w-[120px] truncate">{caseItem.personITrete || "-"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {caseItem.objektiIPadise || "-"}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.gjykataShkalle || "-"}</TableCell>
                          <TableCell className="max-w-[180px] truncate">{caseItem.fazaGjykataShkalle || "-"}</TableCell>
                          <TableCell className="max-w-[180px] truncate">{formatDateTime(caseItem.zhvillimiSeancesShkalleI) || "-"}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.gjykataApelit || "-"}</TableCell>
                          <TableCell className="max-w-[180px] truncate">{caseItem.fazaGjykataApelit || "-"}</TableCell>
                          <TableCell className="max-w-[180px] truncate">{formatDateTime(caseItem.zhvillimiSeancesApel) || "-"}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.fazaAktuale || "-"}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.perfaqesuesi || "-"}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.demiIPretenduar || "-"}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.shumaGjykata || "-"}</TableCell>
                          <TableCell className="max-w-[180px] truncate">{caseItem.vendimEkzekutim || "-"}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{caseItem.fazaEkzekutim || "-"}</TableCell>

                          <TableCell className="max-w-[150px] truncate">{caseItem.gjykataLarte || "-"}</TableCell>
                          <TableCell>{formatDate(caseItem.createdAt ? new Date(caseItem.createdAt).toISOString() : null)}</TableCell>
                          <TableCell className="max-w-[120px] truncate">{caseItem.createdByName || "Përdorues i panjohur"}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViewingCase(caseItem)}
                                title="Shiko detajet"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canUserModifyEntry(caseItem) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingCase(caseItem)}
                                  title="Modifiko"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canUserDeleteEntry() && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(caseItem.id)}
                                  disabled={deleteMutation.isPending}
                                  title="Fshi"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollHintContainer>

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

        {/* View Modal */}
        <Dialog open={!!viewingCase} onOpenChange={(open) => !open && setViewingCase(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detajet e Çështjes</DialogTitle>
            </DialogHeader>
            {viewingCase && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Paditesi</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingCase.paditesi}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">I Paditur</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingCase.iPaditur}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Person i Tretë</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingCase.personITrete || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Objekti i Padisë</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingCase.objektiIPadise || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Gjykata Shkallë së Parë</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingCase.gjykataShkalle || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Faza Shkallë I</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingCase.fazaGjykataShkalle || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Zhvillimi i seances gjyqesorë (Shkallë I)</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{formatDateTime(viewingCase.zhvillimiSeancesShkalleI) || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Gjykata Apelit</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingCase.gjykataApelit || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Faza Apelit</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingCase.fazaGjykataApelit || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Zhvillimi i seances gjyqesorë (Apel)</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{formatDateTime(viewingCase.zhvillimiSeancesApel) || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Faza Aktuale</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingCase.fazaAktuale || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Përfaqësuesi</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingCase.perfaqesuesi || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Demi i Pretenduar</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingCase.demiIPretenduar || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Shuma Gjykatë</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingCase.shumaGjykata || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Vendim Ekzekutim</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingCase.vendimEkzekutim || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Faza Ekzekutim</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingCase.fazaEkzekutim || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Gjykata e Lartë</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingCase.gjykataLarte || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Krijuar më</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{formatDate(viewingCase.createdAt ? new Date(viewingCase.createdAt).toISOString() : null)}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Krijuar nga</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{(viewingCase as any).createdByName || "Përdorues i panjohur"}</p>
                  </div>
                </div>

                {/* Attachments Section */}
                {viewingCase.attachments && Array.isArray(viewingCase.attachments) && viewingCase.attachments.length > 0 && (
                  <div className="space-y-3 border-t pt-4 mt-4">
                    <label className="text-sm font-medium text-gray-700">Dokumenta të Bashkangjitur</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {viewingCase.attachments.map((attachment: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {attachment.type?.includes('pdf') ? (
                              <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                            ) : (
                              <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                              {attachment.size && (
                                <p className="text-xs text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0 ml-2"
                            onClick={() => {
                              const downloadUrl = attachment.url.startsWith('/documents/') 
                                ? attachment.url 
                                : `/documents/${attachment.url}`;
                              window.open(downloadUrl, '_blank');
                            }}
                            data-testid={`button-download-attachment-${index}`}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Shkarko
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button variant="outline" onClick={() => setViewingCase(null)}>
                    Mbyll
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

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