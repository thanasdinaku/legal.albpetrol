import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import DashboardStats from "@/components/dashboard-stats";
import RecentActivity from "@/components/recent-activity";
import { ScrollHintContainer } from "@/components/ui/scroll-hint-container";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="fas fa-database text-white text-2xl"></i>
          </div>
          <p className="text-gray-600">Duke ngarkuar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header 
          title="Përmbledhja e Panelit" 
          subtitle="Mirë se erdhët! Këtu është përmbledhja e të dhënave tuaja." 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-hidden p-4 sm:p-6">
          <ScrollHintContainer
            direction="vertical"
            maxHeight="100%"
            data-testid="dashboard-scroll-container"
            className="h-full"
          >
            <div className="space-y-6">
            <DashboardStats />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivity />
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Veprime të Shpejta</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Button clicked! Navigating to user management...", { user });
                      alert("Button clicked! Check console.");
                      // Force page navigation
                      window.location.href = '/user-management';
                    }}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-blue-50 transition duration-200 group cursor-pointer"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <i className="fas fa-users text-2xl text-gray-400 group-hover:text-primary mb-2 pointer-events-none"></i>
                    <p className="text-sm font-medium text-gray-600 group-hover:text-primary pointer-events-none">Menaxho Përdoruesit</p>
                  </button>
                </div>
              </div>
            </div>
            </div>
          </ScrollHintContainer>
        </main>
      </div>
    </div>
  );
}
