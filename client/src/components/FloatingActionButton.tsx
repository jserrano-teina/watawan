import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="fixed bottom-24 right-8 w-14 h-14 bg-primary text-black rounded-full flex items-center justify-center shadow-xl z-30 hover:bg-primary/90 hover:scale-105 transition-all duration-300 safe-area-right"
      aria-label="Añadir deseo"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{minWidth: '24px', color: '#000000', stroke: '#000000'}}>
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  );
};

export default FloatingActionButton;
