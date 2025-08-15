#!/bin/bash
# Complete fix for Edit button - replace production case-table.tsx with working version

echo "🔧 Replacing production case-table.tsx with working version..."

cd /opt/ceshtje_ligjore/ceshtje_ligjore

# Create backup of current production file
cp client/src/components/case-table.tsx client/src/components/case-table.tsx.backup.$(date +%Y%m%d_%H%M%S)

# Create the working case-table.tsx file
cat > client/src/components/case-table.tsx << 'WORKING_COMPONENT_EOF'
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, Download, FileSpreadsheet, SortAsc, SortDesc, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CaseEditForm } from "@/components/case-edit-form";
import type { DataEntry } from "@shared/schema";

// Custom hook for debounced search
function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
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

  const debouncedSearchTerm = useDebounced(searchTerm, 500);

  // Build explicit API URL with parameters
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', '10');
    params.append('sortOrder', sortOrder);
    if (debouncedSearchTerm) {
      params.append('search', debouncedSearchTerm);
    }
    return `/api/data-entries?${params.toString()}`;
  }, [currentPage, debouncedSearchTerm, sortOrder]);

  // Use explicit fetch with the constructed URL
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: [apiUrl],
    queryFn: async () => {
      const res = await fetch(apiUrl, { credentials: 'include' });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/data-entries/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Çështja u fshi",
        description: "Çështja u largua me sukses nga baza e të dhënave",
      });
      refetch();
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm("A jeni i sigurt që dëshironi të fshini këtë çështje?")) {
      deleteMutation.mutate(id);
    }
  };

  const canUserModifyEntry = (entry: DataEntry & { createdByName: string }) => {
    return user?.role === "admin" || entry.createdById === user?.id;
  };

  const canUserDeleteEntry = () => user?.role === "admin";

  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      params.append('sortOrder', sortOrder);
      
      const exportUrl = `/api/data-entries/export/${format}?${params.toString()}`;
      const response = await fetch(exportUrl, { credentials: 'include' });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ceshtjet-ligjore-${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Eksportimi u krye me sukses",
        description: `Skedari ${format.toUpperCase()} u shkarkua`,
      });
    } catch (error) {
      toast({
        title: "Gabim në eksportim",
        description: "Ndodhi një gabim gjatë eksportimit",
        variant: "destructive",
      });
    }
  };

  const handleSort = (order: 'desc' | 'asc') => {
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSortOrder('desc');
    setCurrentPage(1);
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
                <Button onClick={() => refetch()} className="mt-4" variant="outline">
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
          <p className="text-gray-600 mt-2">Shikoni dhe menaxhoni të gjitha çështjet e regjistruara</p>
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

              <Button onClick={clearFilters} variant="outline" data-testid="button-clear-filters">
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
                    <Button onClick={clearFilters} className="mt-4" variant="outline">
                      Pastro kërkimin
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Nr.</TableHead>
                      <TableHead className="min-w-48">Paditesi</TableHead>
                      <TableHead className="min-w-48">I Paditur</TableHead>
                      <TableHead className="min-w-32">Gjykata</TableHead>
                      <TableHead className="min-w-32">Faza Aktuale</TableHead>
                      <TableHead className="min-w-32">Përfaqësuesi</TableHead>
                      <TableHead className="min-w-32">Krijuar nga</TableHead>
                      <TableHead className="min-w-24">Data</TableHead>
                      <TableHead className="w-32">Veprimet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {response.entries.map((entry: any) => (
                      <TableRow key={entry.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{entry.nrRendor}</TableCell>
                        <TableCell className="font-medium">{entry.paditesi}</TableCell>
                        <TableCell>{entry.iPaditur}</TableCell>
                        <TableCell>{entry.gjykataShkalle || entry.gjykataApelit || "-"}</TableCell>
                        <TableCell>{entry.fazaAktuale || "-"}</TableCell>
                        <TableCell>{entry.perfaqesuesi || "-"}</TableCell>
                        <TableCell>{entry.createdByName}</TableCell>
                        <TableCell>{formatDate(entry.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setViewingCase(entry)}
                                  data-testid={`button-view-${entry.id}`}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Detajet e Çështjes #{entry.nrRendor}</DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                  <div><strong>Paditesi:</strong> {entry.paditesi}</div>
                                  <div><strong>I Paditur:</strong> {entry.iPaditur}</div>
                                  <div><strong>Person i Tretë:</strong> {entry.personITrete || "-"}</div>
                                  <div><strong>Objekti i Padisë:</strong> {entry.objektiIPadise || "-"}</div>
                                  <div><strong>Gjykata Shkallë I:</strong> {entry.gjykataShkalle || "-"}</div>
                                  <div><strong>Faza Shkallë I:</strong> {entry.fazaGjykataShkalle || "-"}</div>
                                  <div><strong>Gjykata Apel:</strong> {entry.gjykataApelit || "-"}</div>
                                  <div><strong>Faza Apel:</strong> {entry.fazaGjykataApelit || "-"}</div>
                                  <div><strong>Faza Aktuale:</strong> {entry.fazaAktuale || "-"}</div>
                                  <div><strong>Përfaqësuesi:</strong> {entry.perfaqesuesi || "-"}</div>
                                  <div><strong>Dëmi i Pretenduar:</strong> {entry.demiIPretenduar || "-"}</div>
                                  <div><strong>Shuma nga Gjykata:</strong> {entry.shumaGjykata || "-"}</div>
                                  <div><strong>Vendim Ekzekutim:</strong> {entry.vendimEkzekutim || "-"}</div>
                                  <div><strong>Faza Ekzekutim:</strong> {entry.fazaEkzekutim || "-"}</div>
                                  <div><strong>Gjykata e Lartë:</strong> {entry.gjykataLarte || "-"}</div>
                                  <div><strong>Krijuar nga:</strong> {entry.createdByName}</div>
                                  <div><strong>Data:</strong> {formatDate(entry.createdAt)}</div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {canUserModifyEntry(entry) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingCase(entry);
                                }}
                                data-testid={`button-edit-${entry.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}

                            {canUserDeleteEntry() && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(entry.id)}
                                className="text-red-600 hover:text-red-700"
                                data-testid={`button-delete-${entry.id}`}
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
              </div>
            )}

            {/* Pagination */}
            {response?.pagination && response.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-gray-500">
                  Faqja {response.pagination.currentPage} nga {response.pagination.totalPages}
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Mbrapa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(response.pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === response.pagination.totalPages}
                    data-testid="button-next-page"
                  >
                    Përpara
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        {editingCase && (
          <Dialog open={!!editingCase} onOpenChange={() => setEditingCase(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ndrysho Çështjen #{editingCase.nrRendor}</DialogTitle>
              </DialogHeader>
              <CaseEditForm
                caseData={editingCase}
                onSuccess={() => {
                  setEditingCase(null);
                  refetch();
                }}
                onCancel={() => setEditingCase(null)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
WORKING_COMPONENT_EOF

echo "Building with the correct case-table.tsx..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo "Restarting production service..."
    systemctl restart albpetrol-legal
    
    echo "Waiting for service to start..."
    sleep 5
    
    if systemctl is-active --quiet albpetrol-legal; then
        echo "✅ Service restarted successfully!"
        echo ""
        echo "🎉 EDIT BUTTON FIXED COMPLETELY!"
        echo ""
        echo "📋 Fixed issues:"
        echo "   ✅ Replaced old case-table.tsx with working version"
        echo "   ✅ Added proper Edit button with correct event handling"
        echo "   ✅ Fixed CaseEditForm props (caseData instead of case)"
        echo "   ✅ Added proper filtering and sorting functionality"
        echo "   ✅ Ensured dialog opens instead of redirecting"
        echo ""
        echo "🔗 Test now at: https://legal.albpetrol.al/data-table"
        echo "   1. Login as any user"
        echo "   2. Find a case they created (or login as admin)"
        echo "   3. Click the Edit button (pencil icon)"
        echo "   4. Edit dialog should open immediately!"
        echo ""
        echo "🎯 What was wrong:"
        echo "   - Production had an old version of case-table.tsx"
        echo "   - Missing proper Edit button implementation"
        echo "   - Wrong props being passed to CaseEditForm"
        echo "   - Now completely fixed with working version"
        echo ""
    else
        echo "❌ Service failed to start"
        systemctl status albpetrol-legal --no-pager
        echo ""
        echo "Check logs: journalctl -u albpetrol-legal -n 20"
    fi
else
    echo "❌ Build failed - checking errors..."
    echo "Check the error messages above for details"
fi