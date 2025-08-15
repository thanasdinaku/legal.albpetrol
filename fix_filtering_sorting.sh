#!/bin/bash

# Albanian Legal Case Management System - Filtering & Sorting Fix Script
# This script fixes filtering and sorting functionality in the "Manage Cases" panel

set -e

echo "=== Albanian Legal Case Management - Filtering & Sorting Fix ==="
echo "Starting fix for filtering and sorting functionality..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root!"
    echo "Please run: sudo $0"
    exit 1
fi

# Set application directory
APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"

if [ ! -d "$APP_DIR" ]; then
    echo "❌ Application directory not found: $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

echo "✅ Found application directory: $APP_DIR"

# Stop the service
echo "🛑 Stopping albpetrol-legal service..."
systemctl stop albpetrol-legal

# Create backup
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup in: $BACKUP_DIR"
cp -r client/ "$BACKUP_DIR/"

echo "🔧 Applying filtering and sorting fixes..."

# Fix 1: Update case-table.tsx to implement proper debounced filtering
echo "1️⃣ Fixing case-table.tsx with debounced filtering..."
cat > client/src/components/case-table.tsx << 'EOF'
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
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, Download, FileSpreadsheet, ArrowUpDown, SortAsc, SortDesc, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CaseEditForm } from "@/components/case-edit-form";
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
      search: debouncedSearchTerm,
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
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
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
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when search changes
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

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, sortOrder]);

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
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[80px]">Nr. Rendor</TableHead>
                        <TableHead className="min-w-[150px]">Paditesi</TableHead>
                        <TableHead className="min-w-[150px]">I Paditur</TableHead>
                        <TableHead className="min-w-[120px]">Person i Tretë</TableHead>
                        <TableHead className="min-w-[200px]">Objekti i Padisë</TableHead>
                        <TableHead className="min-w-[150px]">Gjykata Shkallë së Parë</TableHead>
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
                        <TableHead className="min-w-[120px]">Veprime</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {response.entries.map((caseItem: DataEntry & { createdByName: string; nrRendor: number }) => (
                        <TableRow key={caseItem.id} data-testid={`row-case-${caseItem.id}`}>
                          <TableCell className="font-medium">{caseItem.nrRendor}</TableCell>
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
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViewingCase(caseItem)}
                                title="Shiko detajet"
                                data-testid={`button-view-${caseItem.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canUserModifyEntry(caseItem) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingCase(caseItem)}
                                  title="Modifiko"
                                  data-testid={`button-edit-${caseItem.id}`}
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
                                  data-testid={`button-delete-${caseItem.id}`}
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

                {/* Pagination */}
                {response?.pagination && response.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-500">
                      Faqja {response.pagination.currentPage} nga {response.pagination.totalPages}
                      {' '}({response.pagination.totalItems} çështje në total)
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1 || isLoading}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        E mëparshme
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(response.pagination.totalPages, currentPage + 1))}
                        disabled={currentPage === response.pagination.totalPages || isLoading}
                        data-testid="button-next-page"
                      >
                        E ardhshme
                        <ChevronRight className="h-4 w-4 ml-1" />
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
                    <label className="text-sm font-medium text-gray-700">Gjykata Apelit</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingCase.gjykataApelit || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Faza Apelit</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingCase.fazaGjykataApelit || "-"}</p>
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
                    <label className="text-sm font-medium text-gray-700">Shuma Gjykata</label>
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
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        {editingCase && (
          <Dialog open={!!editingCase} onOpenChange={(open) => !open && setEditingCase(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
EOF

echo "2️⃣ Building application..."
npm run build

echo "3️⃣ Starting albpetrol-legal service..."
systemctl start albpetrol-legal

echo "4️⃣ Checking service status..."
sleep 5
systemctl status albpetrol-legal --no-pager

echo ""
echo "✅ Filtering and Sorting Fix Complete!"
echo ""
echo "🔧 Changes Applied:"
echo "   ✓ Implemented debounced search (500ms delay)"
echo "   ✓ Fixed sorting button behavior"
echo "   ✓ Added proper cache invalidation"
echo "   ✓ Enhanced error handling and retry functionality"
echo "   ✓ Improved user feedback and loading states"
echo "   ✓ Added search term display in results"
echo ""
echo "📋 Testing Instructions:"
echo "1. Visit: https://legal.albpetrol.al"
echo "2. Go to 'Menaxhimi i Çështjeve Ligjore' (Manage Cases)"
echo "3. Test filtering by typing in the search box"
echo "4. Test sorting with 'Më të Rejat' and 'Më të Vjetrat' buttons"
echo "5. Verify the results update correctly"
echo ""
echo "🚀 Service Status:"
systemctl is-active albpetrol-legal && echo "   ✅ Service is running" || echo "   ❌ Service is not running"
echo ""
echo "📁 Backup created at: $APP_DIR/$BACKUP_DIR/"
echo ""
echo "If you experience any issues, you can restore from backup:"
echo "   cd $APP_DIR"
echo "   systemctl stop albpetrol-legal"
echo "   rm -rf client/"
echo "   mv $BACKUP_DIR/ client/"
echo "   npm run build"
echo "   systemctl start albpetrol-legal"