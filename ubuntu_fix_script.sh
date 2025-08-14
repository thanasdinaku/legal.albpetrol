#!/bin/bash

# Ubuntu Production Server - JSON Error Fix Script
# Run this script on your Ubuntu server (10.5.20.31)

echo "=== Albpetrol Legal System - JSON Error Fix ==="
echo "This will fix the data entry and user management JSON parsing errors"
echo ""

# Navigate to application directory
cd /opt/ceshtje_ligjore/ceshtje_ligjore

# Stop the service
echo "Stopping albpetrol-legal service..."
sudo systemctl stop albpetrol-legal

# Create backup
echo "Creating backup..."
sudo cp -r client/ client_backup_$(date +%Y%m%d_%H%M%S)

# Fix 1: Update queryClient.ts error handling
echo "Fixing queryClient.ts error handling..."
sudo tee client/src/lib/queryClient.ts > /dev/null << 'EOF'
import type { QueryKey } from "@tanstack/react-query";
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { rateLimitedFetch, cache } from "@/utils/apiOptimization";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to parse as JSON first (for API errors)
      const errorResponse = await res.json();
      const message = errorResponse.message || errorResponse.error || res.statusText;
      throw new Error(`${res.status}: ${message}`);
    } catch (parseError) {
      // If JSON parsing fails, try to get text
      try {
        const text = await res.text() || res.statusText;
        // If it's HTML content, extract a more meaningful message
        if (text.includes('<!DOCTYPE')) {
          throw new Error(`${res.status}: Server error - please try again`);
        }
        throw new Error(`${res.status}: ${text}`);
      } catch (textError) {
        // Final fallback
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
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
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
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data) {
    requestConfig.body = JSON.stringify(data);
  }

  const response = await rateLimitedFetch(url, requestConfig);
  await throwIfResNotOk(response);
  return response;
}
EOF

# Fix 2: Update case-entry-form.tsx error handling
echo "Fixing case-entry-form.tsx error handling..."
sudo sed -i '/onError: (error) => {/,/},/c\
    onError: (error) => {\
      console.error('\''Data entry submission error:'\'', error);\
      \
      // Handle authentication errors specifically\
      if (error.message.includes('\''401'\'') || error.message.includes('\''Unauthorized'\'')) {\
        toast({\
          title: "Sesioni ka skaduar",\
          description: "Ju lutem kyçuni përsëri në sistem",\
          variant: "destructive",\
        });\
        // Redirect to login after a short delay\
        setTimeout(() => {\
          window.location.href = "/auth";\
        }, 2000);\
      } else {\
        toast({\
          title: "Gabim në shtimin e çështjes",\
          description: error.message || "Ndodhi një gabim gjatë regjistrimit të çështjes",\
          variant: "destructive",\
        });\
      }\
    },' client/src/components/case-entry-form.tsx

# Rebuild the application
echo "Rebuilding application..."
npm run build

# Start the service
echo "Starting albpetrol-legal service..."
sudo systemctl start albpetrol-legal

# Check status
echo "Checking service status..."
sudo systemctl status albpetrol-legal

echo ""
echo "=== Fix Complete ==="
echo "The JSON parsing errors have been fixed."
echo "Test by accessing: https://legal.albpetrol.al"
echo "Try creating a new user or data entry - the errors should be resolved."