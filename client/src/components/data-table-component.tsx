import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";
import type { DataEntry } from "@shared/schema";

interface DataTableResponse {
  entries: DataEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function DataTableComponent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery<DataTableResponse>({
    queryKey: ["/api/data-entries", { 
      search, 
      category: category === "all" ? "" : category, 
      status: status === "all" ? "" : status, 
      page, 
      limit 
    }],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/data-entries/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Sukses",
        description: "Çështja u fshi me sukses.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/data-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-entries"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Pa Autorizim",
          description: "Jeni shkëputur. Duke u kyçur përsëri...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Gabim",
        description: "Dështoi fshirja e çështjes. Ju lutemi provoni përsëri.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (id: number) => {
    if (window.confirm("Jeni i sigurt që doni të fshini këtë çështje?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="status-badge-active">Aktiv</Badge>;
      case "inactive":
        return <Badge className="status-badge-inactive">Joaktiv</Badge>;
      case "pending":
        return <Badge className="status-badge-pending">Në pritje</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </div>
              <div className="flex space-x-3">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-28" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Data Records</h3>
            <p className="text-gray-600 mt-1">Manage and view all database entries</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" className="secondary-button">
              <i className="fas fa-filter mr-2"></i>Filter
            </Button>
            <Button variant="outline" className="secondary-button">
              <i className="fas fa-download mr-2"></i>Export
            </Button>
            <Button onClick={() => window.location.href = '/data-entry'} className="primary-button">
              <i className="fas fa-plus mr-2"></i>Add Entry
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            type="search"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="input-field">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="input-field">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => {
              setSearch("");
              setCategory("all");
              setStatus("all");
              setPage(1);
            }}
            variant="outline"
            className="secondary-button"
          >
            Clear Filters
          </Button>
        </div>
      </CardContent>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Objekti i Padisë
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gjykata Shkallë
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Faza
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data e Krijimit
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Veprime
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.entries?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="text-center">
                    <i className="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">Nuk u gjetën çështje</p>
                  </div>
                </td>
              </tr>
            ) : (
              data?.entries?.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{entry.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.objektiIPadise || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.gjykataShkalle || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(entry.fazaAktuale || 'aktiv')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(entry.createdAt!), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900" title="Shiko">
                      <i className="fas fa-eye"></i>
                    </button>
                    {user?.role === 'admin' && (
                      <>
                        <button className="text-indigo-600 hover:text-indigo-900" title="Modifiko">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Fshi"
                          disabled={deleteMutation.isPending}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            Duke treguar {((data.pagination.page - 1) * data.pagination.limit) + 1} deri në {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} nga {data.pagination.total} rezultate
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              variant="outline"
              size="sm"
            >
              I mëparshmi
            </Button>
            {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              onClick={() => setPage(page + 1)}
              disabled={page === data.pagination.totalPages}
              variant="outline"
              size="sm"
            >
              Tjetër
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
