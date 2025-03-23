import React from 'react';
import { cn } from '@/lib/utils';

interface WishlistTabsProps {
  activeTab: 'wishes' | 'reserved';
  onTabChange: (tab: 'wishes' | 'reserved') => void;
}

const WishlistTabs: React.FC<WishlistTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="border-b border-[#333] mt-4">
      <div className="flex space-x-8">
        <button 
          className={cn(
            "py-3 font-medium text-sm", 
            activeTab === 'wishes' 
              ? "border-b-2 border-primary text-primary" 
              : "text-gray-400 hover:text-white/80 transition-colors"
          )}
          onClick={() => onTabChange('wishes')}
        >
          Mis deseos
        </button>
        <button 
          className={cn(
            "py-3 font-medium text-sm", 
            activeTab === 'reserved' 
              ? "border-b-2 border-primary text-primary" 
              : "text-gray-400 hover:text-white/80 transition-colors"
          )}
          onClick={() => onTabChange('reserved')}
        >
          Reservados para mí
        </button>
      </div>
    </div>
  );
};

export default WishlistTabs;
