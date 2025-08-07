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
import { Search, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { DataEntry } from "@shared/schema";

export default function CaseTable() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [editingCase, setEditingCase] = useState<DataEntry | null>(null);

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/data-entries", { 
      page: currentPage, 
      search: searchTerm, 
      status: statusFilter,
      priority: priorityFilter 
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      aktiv: { label: "Aktiv", variant: "default" as const },
      mbyllur: { label: "Mbyllur", variant: "secondary" as const },
      pezull: { label: "Pezull", variant: "destructive" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.aktiv;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      i_ulet: { label: "I Ulët", variant: "outline" as const },
      mesatar: { label: "Mesatar", variant: "secondary" as const },
      i_larte: { label: "I Lartë", variant: "destructive" as const },
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.mesatar;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Kërko sipas emrit, nr. rendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtro sipas statusit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Të gjitha</SelectItem>
                  <SelectItem value="aktiv">Aktiv</SelectItem>
                  <SelectItem value="mbyllur">Mbyllur</SelectItem>
                  <SelectItem value="pezull">Pezull</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtro sipas prioritetit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Të gjitha</SelectItem>
                  <SelectItem value="i_ulet">I Ulët</SelectItem>
                  <SelectItem value="mesatar">Mesatar</SelectItem>
                  <SelectItem value="i_larte">I Lartë</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setPriorityFilter("");
                  setCurrentPage(1);
                }}
                variant="outline"
              >
                Pastro Filtrat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Çështjet Ligjore</CardTitle>
            <CardDescription>
              {response ? `${response.pagination?.total || 0} çështje në total` : ""}
            </CardDescription>
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nr. Rendor</TableHead>
                        <TableHead>Paditesi</TableHead>
                        <TableHead>I Paditur</TableHead>
                        <TableHead>Objekti i Padisë</TableHead>
                        <TableHead>Statusi</TableHead>
                        <TableHead>Prioriteti</TableHead>
                        <TableHead>Ankimuar</TableHead>
                        <TableHead>Përfunduar</TableHead>
                        <TableHead>Krijuar më</TableHead>
                        {user?.role === "admin" && <TableHead>Veprime</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {response.entries.map((caseItem: DataEntry) => (
                        <TableRow key={caseItem.id}>
                          <TableCell className="font-medium">{caseItem.nrRendor}</TableCell>
                          <TableCell>{caseItem.paditesi}</TableCell>
                          <TableCell>{caseItem.iPaditur}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {caseItem.objektiIPadise || "-"}
                          </TableCell>
                          <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                          <TableCell>{getPriorityBadge(caseItem.priority)}</TableCell>
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
                          <TableCell>{formatDate(caseItem.createdAt)}</TableCell>
                          {user?.role === "admin" && (
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
      </div>
    </div>
  );
}