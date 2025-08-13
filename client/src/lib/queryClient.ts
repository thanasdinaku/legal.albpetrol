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
      // If JSON parsing fails, fall back to text
      const text = await res.text() || res.statusText;
      // If it's HTML content, extract a more meaningful message
      if (text.includes('<!DOCTYPE')) {
        throw new Error(`${res.status}: Server error - please try again`);
      }
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await rateLimitedFetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Clear cache for relevant endpoints after mutations
  if (method !== 'GET') {
    cache.clear();
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;
    
    // If there are query parameters, build the URL with them
    if (queryKey.length > 1 && queryKey[1]) {
      const params = new URLSearchParams();
      const queryParams = queryKey[1] as Record<string, any>;
      
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    // Check cache first for GET requests
    if (cache.get(url)) {
      return cache.get(url);
    }

    const res = await rateLimitedFetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    
    // Cache the response for 2 minutes
    cache.set(url, data, 120000);
    
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Only refetch if data is stale
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 10, // 10 minutes - keep data fresh longer
      gcTime: 1000 * 60 * 30, // 30 minutes - cache much longer (TanStack Query v5)
      retry: (failureCount, error) => {
        // Don't retry if it's a rate limit error
        if (error.message.includes('429') || error.message.includes('rate limit') || error.message.includes('Too Many Requests')) {
          return false;
        }
        return failureCount < 1; // Reduce retries
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 3 ** attemptIndex, 10000), // Longer delays
    },
    mutations: {
      retry: (failureCount, error) => {
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          return false;
        }
        return failureCount < 1;
      },
      retryDelay: 2000, // 2 second delay for mutations
    },
  },
});
