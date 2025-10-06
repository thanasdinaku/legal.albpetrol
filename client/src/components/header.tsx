
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserCheck, Shield } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
  onMenuToggle?: () => void;
}

export default function Header({ title, subtitle, onMenuToggle }: HeaderProps) {
  const { user } = useAuth();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      // Clear the auth cache first
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
      
      // Then redirect to logout endpoint
      window.location.href = "/api/auth/logout";
    } catch (error) {
      // Fallback: just redirect
      window.location.href = "/api/auth/logout";
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile menu button and title */}
        <div className="flex items-center min-w-0">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-1 mr-2 hover:opacity-70 active:opacity-50 transition-opacity"
              data-testid="button-mobile-menu"
              aria-label="Open menu"
            >
              <i className="fas fa-ellipsis-v text-2xl text-gray-900"></i>
            </button>
          )}
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h2>
            <p className="text-gray-600 mt-1 text-sm hidden sm:block">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">



          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2 p-1 sm:p-2 rounded-lg hover:bg-gray-100 focus:outline-none">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="User profile" 
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-gray-600 text-xs sm:text-sm"></i>
                  </div>
                )}
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <i className="fas fa-chevron-down text-gray-400 text-xs hidden sm:block"></i>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <p className="text-xs text-gray-500 capitalize mt-1">
                  {user?.role === 'admin' ? 'Administrator' : 'Përdorues'}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                <i className="fas fa-user mr-2"></i>
                Profili im
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = "/settings"}>
                <i className="fas fa-cog mr-2"></i>
                Cilësimet
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <i className="fas fa-sign-out-alt mr-2"></i>
                Dalje
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {user?.role === 'admin' ? (
                <>
                  <Shield className="h-5 w-5 text-red-600" />
                  Administratori
                </>
              ) : (
                <>
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  Përdorues i Rregullt
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {user?.role === 'admin' ? (
                  <>
                    <li>• Përmban të gjitha lejet e përdoruesit të rregullt</li>
                    <li>• Modifikon regjistrimet ekzistuese të rasteve ligjore</li>
                    <li>• Fshin regjistrimet e rasteve ligjore</li>
                    <li>• Menaxhon llogaritë dhe rolet e përdoruesve</li>
                    <li>• Shikon panelin e menaxhimit të përdoruesve</li>
                    <li>• Çaktivizon llogaritë e përdoruesve</li>
                  </>
                ) : (
                  <>
                    <li>• Shikon statistikat e panelit</li>
                    <li>• Shton regjistrime të reja të rasteve ligjore</li>
                    <li>• Shikon të gjitha të dhënat e rasteve në tabela</li>
                    <li>• Eksporton të dhënat (Excel, CSV)</li>
                    <li>• Editon të dhënat e regjistrimeve që krijon vetë</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </header>
  );
}
