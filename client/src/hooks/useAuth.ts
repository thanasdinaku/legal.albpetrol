import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: "include", // Include cookies for session
      });
      if (!response.ok) {
        if (response.status === 401) {
          return null; // User not authenticated
        }
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
    retry: false,
    staleTime: 1000 * 60 * 20, // 20 minutes for user auth
    refetchInterval: 1000 * 60 * 15, // Refresh every 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true, // Only refetch when reconnecting
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
