import React from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-xl z-20 hidden md:flex hover:bg-primary/90 hover:scale-105 transition-all duration-300"
    >
      <i className="fas fa-plus text-xl"></i>
    </button>
  );
};

export default FloatingActionButton;
