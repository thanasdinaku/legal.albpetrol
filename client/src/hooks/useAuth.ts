import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
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
