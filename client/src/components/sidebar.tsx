import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import albpetrolLogo from "@assets/Albpetrol.svg_1754604323425.png";

export default function Sidebar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();



  const isActive = (path: string) => location === path;

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="text-center space-y-3">
          <img 
            src={albpetrolLogo} 
            alt="Albpetrol Logo" 
            className="w-32 h-20 object-contain mx-auto"
          />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Pasqyra e Ceshtjeve Ligjore</h1>
            <p className="text-sm text-gray-500 capitalize">{user?.role === 'admin' ? 'Administrator' : 'Përdorues'}</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        <button
          onClick={() => setLocation('/')}
          className={isActive('/') ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}
        >
          <i className="fas fa-tachometer-alt"></i>
          <span>Paneli Kryesor</span>
        </button>
        
        <button
          onClick={() => setLocation('/data-entry')}
          className={isActive('/data-entry') ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}
        >
          <i className="fas fa-plus-circle"></i>
          <span>Regjistro Çështje</span>
        </button>
        
        <button
          onClick={() => setLocation('/data-table')}
          className={isActive('/data-table') ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}
        >
          <i className="fas fa-table"></i>
          <span>{user?.role === 'admin' ? 'Menaxho Çështjet' : 'Shiko Çështjet'}</span>
        </button>
        
        {user?.role === 'admin' && (
          <button
            onClick={() => setLocation('/csv-import')}
            className={isActive('/csv-import') ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}
          >
            <i className="fas fa-file-import"></i>
            <span>Importo CSV</span>
          </button>
        )}
        
        {user?.role === 'admin' && (
          <div className="border-t border-gray-200 pt-2 mt-2">
            <button
              onClick={() => setLocation('/user-management')}
              className={isActive('/user-management') ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}
            >
              <i className="fas fa-users"></i>
              <span>Menaxhimi i Përdoruesve</span>
            </button>
            <button
              onClick={() => setLocation('/system-settings')}
              className={isActive('/system-settings') ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}
            >
              <i className="fas fa-cog"></i>
              <span>Cilësimet e Sistemit</span>
            </button>
          </div>
        )}
      </nav>


    </div>
  );
}
