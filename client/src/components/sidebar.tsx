import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import albpetrolLogo from "@assets/Albpetrol.svg_1754604323425.png";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export default function Sidebar({ isOpen = true, onClose, className }: SidebarProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();



  const isActive = (path: string) => location === path;

  const handleNavigation = (path: string) => {
    setLocation(path);
    onClose?.(); // Close mobile sidebar after navigation
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && onClose && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:transform-none",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        className
      )}>
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="text-center space-y-3">
            {/* Close button for mobile */}
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 lg:hidden"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            )}
            <img 
              src={albpetrolLogo} 
              alt="Albpetrol Logo" 
              className="w-24 h-16 sm:w-32 sm:h-20 object-contain mx-auto"
            />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Pasqyra e Ceshtjeve Ligjore</h1>
              <p className="text-xs sm:text-sm text-gray-500 capitalize">{user?.role === 'admin' ? 'Administrator' : 'Përdorues'}</p>
            </div>
          </div>
        </div>
      
      <nav className="p-4 space-y-2 overflow-y-auto flex-1">
        <button
          onClick={() => handleNavigation('/')}
          className={isActive('/') ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}
        >
          <i className="fas fa-tachometer-alt"></i>
          <span className="text-sm sm:text-base">Paneli Kryesor</span>
        </button>
        
        <button
          onClick={() => handleNavigation('/data-entry')}
          className={isActive('/data-entry') ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}
        >
          <i className="fas fa-plus-circle"></i>
          <span className="text-sm sm:text-base">Regjistro Çështje</span>
        </button>
        
        <button
          onClick={() => handleNavigation('/data-table')}
          className={isActive('/data-table') ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}
        >
          <i className="fas fa-table"></i>
          <span className="text-sm sm:text-base">Menaxho Çështjet</span>
        </button>
        
        {user?.role === 'admin' && (
          <div className="border-t border-gray-200 pt-2 mt-2">
            <button
              onClick={() => handleNavigation('/user-management')}
              className={isActive('/user-management') ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}
            >
              <i className="fas fa-users"></i>
              <span className="text-sm sm:text-base">Menaxhimi i Përdoruesve</span>
            </button>
            <button
              onClick={() => handleNavigation('/system-settings')}
              className={isActive('/system-settings') ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}
            >
              <i className="fas fa-cog"></i>
              <span className="text-sm sm:text-base">Cilësimet e Sistemit</span>
            </button>
          </div>
        )}
        
        {/* Personal Settings - Always visible for all users */}
        <div className="border-t border-gray-200 pt-2 mt-2">
          <button
            onClick={() => handleNavigation('/settings')}
            className={isActive('/settings') ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}
          >
            <i className="fas fa-user-cog"></i>
            <span className="text-sm sm:text-base">Cilësimet</span>
          </button>

          {/* User Manual - Available for all users */}
          <button
            onClick={() => handleNavigation('/manual')}
            className={isActive('/manual') ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}
          >
            <i className="fas fa-book"></i>
            <span className="text-sm sm:text-base">Manual i Përdoruesit</span>
          </button>
        </div>
      </nav>
    </div>
    </>
  );
}
