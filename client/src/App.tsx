import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ApiStatusIndicator } from "@/components/api-status-indicator";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login-page";
import Home from "@/pages/home";
import DataEntry from "@/pages/data-entry";
import DataTable from "@/pages/data-table";
import UserManagement from "@/pages/user-management";
import SystemSettings from "@/pages/system-settings";
import SettingsPage from "@/pages/settings-page";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
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
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={LoginPage} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/data-entry" component={DataEntry} />
          <Route path="/data-table" component={DataTable} />

          <Route path="/user-management" component={UserManagement} />
          <Route path="/system-settings" component={SystemSettings} />
          <Route path="/settings" component={SettingsPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ApiStatusIndicator>
          <Router />
        </ApiStatusIndicator>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
