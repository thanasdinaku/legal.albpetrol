import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import CaseEntryForm from "@/components/case-entry-form";

export default function DataEntry() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Regjistro Çështje të Re" 
          subtitle="Plotësoni formën për të shtuar një çështje ligjore në sistem" 
        />
        <main className="flex-1 overflow-y-auto p-6">
          <CaseEntryForm />
        </main>
      </div>
    </div>
  );
}
