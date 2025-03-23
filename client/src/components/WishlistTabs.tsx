import React from 'react';
import { cn } from '@/lib/utils';

interface WishlistTabsProps {
  // Mantener la interfaz por compatibilidad pero simplificar
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const WishlistTabs: React.FC<WishlistTabsProps> = () => {
  return (
    <div className="border-b border-[#333] mt-4">
      <div className="flex space-x-8">
        <div 
          className="py-3 font-medium text-sm border-b-2 border-primary text-primary"
        >
          Mis deseos
        </div>
      </div>
    </div>
  );
};

export default WishlistTabs;
