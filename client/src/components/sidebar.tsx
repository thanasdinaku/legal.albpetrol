import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function Sidebar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const isActive = (path: string) => location === path;

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-database text-white"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">DataBase Pro</h1>
            <p className="text-sm text-gray-500 capitalize">{user?.role || 'User'}</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        <button
          onClick={() => setLocation('/')}
          className={isActive('/') ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}
        >
          <i className="fas fa-tachometer-alt"></i>
          <span>Dashboard</span>
        </button>
        
        <button
          onClick={() => setLocation('/data-entry')}
          className={isActive('/data-entry') ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}
        >
          <i className="fas fa-plus-circle"></i>
          <span>Add New Entry</span>
        </button>
        
        <button
          onClick={() => setLocation('/data-table')}
          className={isActive('/data-table') ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}
        >
          <i className="fas fa-table"></i>
          <span>View All Data</span>
        </button>
        
        {user?.role === 'admin' && (
          <button
            onClick={() => setLocation('/csv-import')}
            className={isActive('/csv-import') ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}
          >
            <i className="fas fa-file-import"></i>
            <span>Import CSV</span>
          </button>
        )}
        
        {user?.role === 'admin' && (
          <div className="border-t border-gray-200 pt-2 mt-2">
            <button className="nav-link w-full text-left">
              <i className="fas fa-users"></i>
              <span>User Management</span>
            </button>
            <button className="nav-link w-full text-left">
              <i className="fas fa-cog"></i>
              <span>System Settings</span>
            </button>
          </div>
        )}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          {user?.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt="User profile" 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <i className="fas fa-user text-gray-600"></i>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-600"
            title="Sign out"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
