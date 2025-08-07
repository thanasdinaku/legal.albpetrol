import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import DashboardStats from "@/components/dashboard-stats";
import RecentActivity from "@/components/recent-activity";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="fas fa-database text-white text-2xl"></i>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Dashboard Overview" 
          subtitle="Welcome back! Here's your data summary." 
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <DashboardStats />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivity />
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => navigate('/data-entry')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-blue-50 transition duration-200 group"
                  >
                    <i className="fas fa-plus text-2xl text-gray-400 group-hover:text-primary mb-2"></i>
                    <p className="text-sm font-medium text-gray-600 group-hover:text-primary">Regjistro Çështje</p>
                  </button>
                  <button 
                    onClick={() => navigate('/data-table')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-blue-50 transition duration-200 group"
                  >
                    <i className="fas fa-table text-2xl text-gray-400 group-hover:text-primary mb-2"></i>
                    <p className="text-sm font-medium text-gray-600 group-hover:text-primary">Shiko të Gjitha</p>
                  </button>
                  <button 
                    onClick={() => navigate('/csv-import')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-blue-50 transition duration-200 group"
                  >
                    <i className="fas fa-file-import text-2xl text-gray-400 group-hover:text-primary mb-2"></i>
                    <p className="text-sm font-medium text-gray-600 group-hover:text-primary">Importo CSV</p>
                  </button>
                  <button 
                    onClick={() => {
                      console.log("Navigating to user management...", { user });
                      navigate('/user-management');
                    }}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-blue-50 transition duration-200 group"
                  >
                    <i className="fas fa-users text-2xl text-gray-400 group-hover:text-primary mb-2"></i>
                    <p className="text-sm font-medium text-gray-600 group-hover:text-primary">Menaxho Përdoruesit</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
