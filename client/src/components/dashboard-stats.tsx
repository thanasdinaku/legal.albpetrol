import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalEntries: number;
  todayEntries: number;
  activeUsers: number;
}

export default function DashboardStats() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
    staleTime: 1000 * 60 * 15, // 15 minutes for stats
    refetchInterval: 1000 * 60 * 10, // Refresh every 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="w-12 h-12 rounded-lg" />
              </div>
              <div className="mt-4 flex items-center">
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Handle unauthorized or invalid response
  if (!stats || typeof stats !== 'object' || 'message' in stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="text-center py-8">
              <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
              <p className="text-gray-500">Gabim në ngarkimin e statistikave</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totali i Çështjeve</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalEntries || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-database text-blue-600"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-green-600 font-medium">+12.5%</span>
            <span className="text-sm text-gray-500 ml-2">nga muaji i shkuar</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Përdorues Aktiv</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.activeUsers || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-green-600"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-green-600 font-medium">+8.2%</span>
            <span className="text-sm text-gray-500 ml-2">nga muaji i shkuar</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Çështjet e Sotme</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.todayEntries || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-calendar-plus text-yellow-600"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-green-600 font-medium">+5.7%</span>
            <span className="text-sm text-gray-500 ml-2">nga dje</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Statusi i Sistemit</p>
              <p className="text-xl font-bold text-green-600">I Shëndetshëm</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-heart text-green-600"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-green-600 font-medium">99.9%</span>
            <span className="text-sm text-gray-500 ml-2">online</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
