import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import type { DataEntry } from "@shared/schema";

interface RecentEntry extends DataEntry {
  createdByName: string;
}

export default function RecentActivity() {
  const { data: recentEntries, isLoading } = useQuery<RecentEntry[]>({
    queryKey: ["/api/dashboard/recent-entries"],
    retry: false,
    staleTime: 1000 * 60 * 10, // 10 minutes for recent entries
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Çështjet e Fundit</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle unauthorized or invalid response
  if (!Array.isArray(recentEntries)) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Çështjet e Fundit</h3>
          <div className="text-center py-8">
            <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
            <p className="text-gray-500">Gabim në ngarkimin e të dhënave</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recentEntries || recentEntries.length === 0) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Çështjet e Fundit</h3>
          <div className="text-center py-8">
            <i className="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">Nuk u gjetën çështje të fundit</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const getRandomColor = (name: string) => {
    const colors = [
      'bg-primary', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Çështjet e Fundit</h3>
        <div className="space-y-4">
          {recentEntries.map((entry: any) => (
            <div key={entry.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className={`w-8 h-8 ${getRandomColor(entry.createdByName)} rounded-full flex items-center justify-center`}>
                <span className="text-white text-sm font-medium">
                  {getInitials(entry.createdByName)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {entry.createdByName} added "{entry.title}"
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
