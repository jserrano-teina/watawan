import React from 'react';

interface BottomNavigationProps {
  activeTab: 'wishes' | 'reserved';
  onTabChange: (tab: 'wishes' | 'reserved') => void;
  onAddWishClick: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  activeTab, 
  onTabChange,
  onAddWishClick 
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] z-20 md:hidden shadow-lg">
      <div className="flex justify-around items-center h-16">
        <button 
          onClick={() => onTabChange('wishes')}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeTab === 'wishes' ? 'text-primary' : 'text-gray-400'
          }`}
        >
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
          onClick={() => onTabChange('reserved')}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activeTab === 'reserved' ? 'text-primary' : 'text-gray-400'
          }`}
        >
          <i className="fas fa-gift text-xl"></i>
          <span className="text-xs mt-1">Reservados</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavigation;
