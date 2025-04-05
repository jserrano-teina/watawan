import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="fixed bottom-24 right-8 w-14 h-14 bg-primary text-black rounded-full flex items-center justify-center shadow-xl z-30 hover:bg-primary/90 hover:scale-105 transition-all duration-300"
      aria-label="Añadir deseo"
    >
      <Plus size={24} className="text-black" />
    </button>
  );
};

export default FloatingActionButton;
