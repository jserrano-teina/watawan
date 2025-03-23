import React, { useState } from 'react';
import { User, Settings, LogOut } from 'lucide-react';

interface BottomNavigationProps {
  onAddWishClick: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  onAddWishClick 
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleUserMenuClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] z-20 md:hidden shadow-lg">
        <div className="flex justify-around items-center h-16">
          <button className="flex flex-col items-center justify-center w-full h-full text-primary">
            <i className="fas fa-gift text-xl"></i>
            <span className="text-xs mt-1">Mis deseos</span>
          </button>
          <div className="relative flex items-center justify-center">
            <button 
              onClick={onAddWishClick}
              className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-xl absolute -top-7 hover:bg-primary/90 transition-all duration-300"
            >
              <i className="fas fa-plus text-xl"></i>
            </button>
          </div>
          <button 
            onClick={handleUserMenuClick}
            className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-white/80 transition-colors"
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Perfil</span>
          </button>
        </div>
      </nav>

      {showUserMenu && (
        <div className="fixed bottom-16 right-0 mr-4 mb-2 bg-[#1a1a1a] rounded-lg shadow-xl border border-[#333] z-30 w-48 overflow-hidden">
          <div className="p-2">
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
