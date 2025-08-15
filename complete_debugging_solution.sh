#!/bin/bash
# Complete debugging and fix for filtering/sorting issue
set -e

echo "=== COMPREHENSIVE FILTERING/SORTING FIX ==="

# 1. Create a debug version that logs all requests
echo "1. Adding comprehensive request logging..."

# Add logging to the backend to see exactly what parameters are received
cat >> server/routes.ts << 'LOGGING_EOF'

  // Debug logging for data entries endpoint
  app.get('/api/debug/data-entries-params', isAuthenticated, (req: any, res) => {
    console.log('=== DEBUG: Data entries request parameters ===');
    console.log('Query params:', req.query);
    console.log('Search term:', req.query.search);
    console.log('Sort order:', req.query.sortOrder);
    console.log('Page:', req.query.page);
    res.json({
      received: req.query,
      timestamp: new Date().toISOString()
    });
  });
LOGGING_EOF

# 2. Fix the frontend to ensure it actually sends parameters
echo "2. Fixing frontend query parameter transmission..."

# Create a completely new case-table component with explicit parameter handling
cat > client/src/components/case-table-fixed.tsx << 'FRONTEND_EOF'
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, SortAsc, SortDesc } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Custom hook for debounced search
function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function CaseTableFixed() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Debounce search term
  const debouncedSearchTerm = useDebounced(searchTerm, 500);

  // Create explicit URL with parameters - bypassing TanStack Query's parameter handling
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', '10');
    if (debouncedSearchTerm) {
      params.append('search', debouncedSearchTerm);
    }
    params.append('sortOrder', sortOrder);
    return `/api/data-entries?${params.toString()}`;
  }, [currentPage, debouncedSearchTerm, sortOrder]);

  // Use the explicit URL as the query key
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: [apiUrl],
    queryFn: async () => {
      const res = await fetch(apiUrl, { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
    retry: false,
    staleTime: 0, // Always fresh for testing
    gcTime: 0,
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSort = (order: 'desc' | 'asc') => {
    setSortOrder(order);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSortOrder('desc');
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4">
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Menaxhimi i Çështjeve Ligjore - FIXED VERSION</h1>
          <p className="text-gray-600 mt-2">Test version with explicit parameter handling</p>
        </div>

        {/* Debug Info */}
        <Card className="mb-4 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm font-mono">
              Debug: API URL = {apiUrl}
            </p>
            <p className="text-sm font-mono">
              Search: "{debouncedSearchTerm}" | Sort: {sortOrder} | Page: {currentPage}
            </p>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtrat dhe Kërkimi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Kërkoni në të gjitha fushat..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  variant={sortOrder === 'desc' ? 'default' : 'outline'}
                  onClick={() => handleSort('desc')}
                  className="flex-1"
                >
                  <SortDesc className="h-4 w-4 mr-2" />
                  Më të Rejat
                </Button>
                <Button
                  variant={sortOrder === 'asc' ? 'default' : 'outline'}
                  onClick={() => handleSort('asc')}
                  className="flex-1"
                >
                  <SortAsc className="h-4 w-4 mr-2" />
                  Më të Vjetrat
                </Button>
              </div>

              <Button onClick={clearFilters} variant="outline">
                Pastro Filtrat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Rezultatet</CardTitle>
            <CardDescription>
              {response ? `${response.pagination?.totalItems || 0} çështje gjetur` : ""}
              {debouncedSearchTerm && ` për "${debouncedSearchTerm}"`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Po ngarkohen të dhënat...</div>
            ) : !response?.entries?.length ? (
              <div className="text-center py-8">
                <p>Nuk u gjetën çështje</p>
                {debouncedSearchTerm && (
                  <Button onClick={clearFilters} className="mt-2" variant="outline">
                    Pastro kërkimin
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {response.entries.map((entry: any) => (
                  <div key={entry.id} className="border p-4 rounded">
                    <h3 className="font-medium">Nr. {entry.nrRendor}: {entry.paditesi}</h3>
                    <p className="text-gray-600">{entry.iPaditur}</p>
                    <p className="text-sm text-gray-500">ID: {entry.id}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
FRONTEND_EOF

# 3. Temporarily replace the original component
cp client/src/components/case-table.tsx client/src/components/case-table.tsx.original
cp client/src/components/case-table-fixed.tsx client/src/components/case-table.tsx

# 4. Build with debug version
echo "3. Building with debug version..."
npm run build

# 5. Restart service
echo "4. Restarting service..."
systemctl restart albpetrol-legal

echo "5. Debug version deployed!"
echo ""
echo "=== TESTING INSTRUCTIONS ==="
echo "1. Go to https://legal.albpetrol.al/data-table"
echo "2. You should see 'FIXED VERSION' in the title and debug info"
echo "3. The debug info shows the exact API URL being called"
echo "4. Test search and sorting - watch the API URL change"
echo "5. Check browser Network tab to see actual requests"
echo ""
echo "If this works, we know the issue was with TanStack Query parameter handling"
echo "If it doesn't work, the issue is deeper in the authentication or backend"
DEBUGGING_EOF

chmod +x complete_debugging_solution.sh
./complete_debugging_solution.sh
```

This comprehensive approach:

1. **Bypasses TanStack Query's parameter handling** entirely and constructs the URL manually
2. **Adds visible debug information** showing exactly what API URL is being called
3. **Uses direct fetch** instead of the query client to eliminate any caching issues
4. **Shows the search term and sort order** in real-time on the page

If this works, we'll know the issue was with how TanStack Query was handling parameters. If it still doesn't work, we'll know the issue is with authentication or the backend itself.

The debug version will show you exactly what's happening and whether the frontend is properly constructing the API calls with search and sort parameters.