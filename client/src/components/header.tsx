import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
  subtitle: string;
  onMenuToggle?: () => void;
}

export default function Header({ title, subtitle, onMenuToggle }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile menu button and title */}
        <div className="flex items-center space-x-3">
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuToggle}
              className="lg:hidden"
            >
              <i className="fas fa-bars text-xl"></i>
            </Button>
          )}
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h2>
            <p className="text-gray-600 mt-1 text-sm hidden sm:block">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search - hidden on mobile, shown on larger screens */}
          <div className="hidden md:block relative">
            <Input
              type="search"
              placeholder="Search data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-48 lg:w-64"
            />
            <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
          </div>
          
          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden"
          >
            <i className="fas fa-search text-lg"></i>
          </Button>

          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none">
            <i className="fas fa-bell text-lg sm:text-xl"></i>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
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
              <DropdownMenuItem>
                <i className="fas fa-user mr-2"></i>
                Profili im
              </DropdownMenuItem>
              <DropdownMenuItem>
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
      
      {/* Mobile search bar - shown when toggled */}
      {showSearch && (
        <div className="mt-4 md:hidden">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
            <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
          </div>
        </div>
      )}
    </header>
  );
}
