import React from 'react';

interface EmptyWishlistProps {
  onAddWish: () => void;
}

const EmptyWishlist: React.FC<EmptyWishlistProps> = ({ onAddWish }) => {
  return (
    <div className="p-6 text-center max-w-md mx-auto">
      {/* Ilustración inspiracional SVG */}
      <div className="mx-auto w-40 h-40 mb-6 flex items-center justify-center">
        <svg width="100%" height="100%" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Círculo de fondo */}
          <circle cx="256" cy="256" r="180" fill="#1A1A1A" stroke="#2A2A2A" strokeWidth="2" />
          
          {/* Estrella en el centro con colores más sutiles */}
          <path 
            d="M256 156L287 220L359 228L306 277L317 349L256 314L195 349L206 277L153 228L225 220L256 156Z" 
            fill="#444" 
            stroke="#555" 
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Icono de "+" en la esquina inferior derecha */}
          <circle cx="350" cy="350" r="30" fill="#333" stroke="#444" strokeWidth="1" />
          <path 
            d="M338 350H362M350 338V362" 
            stroke="#666" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h2 className="font-bold text-2xl text-white mb-3">Tu lista de deseos está vacía</h2>
      <p className="text-white mb-6">Añade tu primer deseo para empezar a compartir con tus amigos</p>
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
