import React from 'react';
import OptimizedImage from './OptimizedImage';

interface EmptyWishlistProps {
  onAddWish: () => void;
}

const EmptyWishlist: React.FC<EmptyWishlistProps> = ({ onAddWish }) => {
  return (
    <div className="p-6 text-center max-w-md mx-auto">
      {/* Imagen de elementos deseados */}
      <div className="mx-auto w-60 h-60 mb-6 flex items-center justify-center">
        <OptimizedImage 
          src="/images/empty_list.png" 
          alt="Elementos deseados" 
          className="w-full h-full"
        />
      </div>
      <h2 className="font-bold text-2xl text-white mb-3">Tu lista de deseos está vacía</h2>
      <p className="text-white/60 mb-6">Añade tu primer deseo para empezar a compartir con tus amigos</p>
      <button 
        onClick={onAddWish}
        className="btn-primary"
      >
        Añadir deseo
      </button>
    </div>
  );
};

export default EmptyWishlist;
