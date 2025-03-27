import React, { useState } from 'react';
import { User, Settings, LogOut, Bell, Home } from 'lucide-react';
import { useLocation } from 'wouter';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/use-auth';

interface BottomNavigationProps {
  onAddWishClick?: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [location, setLocation] = useLocation();
  const { unreadCount, isLoading } = useNotifications();
  const { user } = useAuth();

  const handleUserMenuClick = () => {
    setShowUserMenu(!showUserMenu);
  };
  
  const navigateTo = (path: string) => {
    setLocation(path);
    setShowUserMenu(false);
  };
  
  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] z-20 md:hidden shadow-lg">
        <div className="flex justify-around items-center h-16">
          <button 
            onClick={() => navigateTo('/')}
            className={`flex flex-col items-center justify-center w-full h-full ${isActive('/') ? 'text-primary' : 'text-gray-400 hover:text-white/80'} transition-colors`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Inicio</span>
          </button>
          
          <button 
            onClick={() => navigateTo('/notifications')}
            className={`flex flex-col items-center justify-center w-full h-full relative ${isActive('/notifications') ? 'text-primary' : 'text-gray-400 hover:text-white/80'} transition-colors`}
          >
            <Bell className="h-5 w-5" />
            <span className="text-xs mt-1">Notificaciones</span>
            
            {!isLoading && unreadCount > 0 && (
              <span className="absolute top-1 right-1/3 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          
          <button 
            onClick={handleUserMenuClick}
            className={`flex flex-col items-center justify-center w-full h-full ${showUserMenu ? 'text-primary' : 'text-gray-400 hover:text-white/80'} transition-colors`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Perfil</span>
          </button>
        </div>
      </nav>

      {showUserMenu && (
        <div className="fixed bottom-16 right-0 mr-4 mb-2 bg-[#1a1a1a] rounded-lg shadow-xl border border-[#333] z-30 w-48 overflow-hidden">
          <div className="p-2">
            <div className="px-3 py-2 text-white/50 text-xs border-b border-[#333] mb-1">
              {user?.email}
            </div>
            <button className="flex items-center w-full p-3 text-left hover:bg-[#252525] rounded-md transition-colors">
              <User className="h-4 w-4 mr-2" />
              <span className="text-sm">Mi perfil</span>
            </button>
            <button className="flex items-center w-full p-3 text-left hover:bg-[#252525] rounded-md transition-colors">
              <Settings className="h-4 w-4 mr-2" />
              <span className="text-sm">Preferencias</span>
            </button>
            <button className="flex items-center w-full p-3 text-left hover:bg-[#252525] rounded-md transition-colors text-red-500">
              <LogOut className="h-4 w-4 mr-2" />
              <span className="text-sm">Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNavigation;