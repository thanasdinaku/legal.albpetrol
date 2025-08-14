#!/bin/bash
set -e

echo "=== Albpetrol Legal - JSON Error Fix ==="
echo "Fixing data entry and user management errors..."

# Navigate to app directory
cd /opt/ceshtje_ligjore/ceshtje_ligjore

# Stop service
systemctl stop albpetrol-legal

# Backup
cp -r client/ "client_backup_$(date +%Y%m%d_%H%M%S)"

# Fix queryClient.ts
cat > client/src/lib/queryClient.ts << 'EOF'
import type { QueryKey } from "@tanstack/react-query";
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { rateLimitedFetch, cache } from "@/utils/apiOptimization";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const errorResponse = await res.json();
      const message = errorResponse.message || errorResponse.error || res.statusText;
      throw new Error(`${res.status}: ${message}`);
    } catch (parseError) {
      try {
        const text = await res.text() || res.statusText;
        if (text.includes('<!DOCTYPE')) {
          throw new Error(`${res.status}: Server error - please try again`);
        }
        throw new Error(`${res.status}: ${text}`);
      } catch (textError) {
        throw new Error(`${res.status}: ${res.statusText || 'Unknown error'}`);
      }
    }
  }
}

const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  const url = queryKey[0] as string;
  const response = await rateLimitedFetch(url);
  await throwIfResNotOk(response);
  return response.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error) => {
        if (error?.message?.includes('401') || error?.message?.includes('403')) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

export async function apiRequest(url: string, method = "GET", data?: any) {
  const requestConfig: RequestInit = {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  };
  if (data) requestConfig.body = JSON.stringify(data);
  const response = await rateLimitedFetch(url, requestConfig);
  await throwIfResNotOk(response);
  return response;
}
EOF

# Fix case-entry-form.tsx - update error handling
sed -i '/onError: (error) => {/,/},$/c\
    onError: (error) => {\
      console.error('\''Data entry submission error:'\'', error);\
      if (error.message.includes('\''401'\'') || error.message.includes('\''Unauthorized'\'')) {\
        toast({\
          title: "Sesioni ka skaduar",\
          description: "Ju lutem kyçuni përsëri në sistem",\
          variant: "destructive",\
        });\
        setTimeout(() => { window.location.href = "/auth"; }, 2000);\
      } else {\
        toast({\
          title: "Gabim në shtimin e çështjes",\
          description: error.message || "Ndodhi një gabim gjatë regjistrimit të çështjes",\
          variant: "destructive",\
        });\
      }\
    },' client/src/components/case-entry-form.tsx

# Rebuild
npm run build

# Start service
systemctl start albpetrol-legal

echo "✅ Fix complete! Test at https://legal.albpetrol.al"