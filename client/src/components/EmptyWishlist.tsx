import React from 'react';

interface EmptyWishlistProps {
  onAddWish: () => void;
}

const EmptyWishlist: React.FC<EmptyWishlistProps> = ({ onAddWish }) => {
  return (
    <div className="p-6 text-center max-w-md mx-auto">
      {/* Ilustración inspiracional SVG */}
      <div className="mx-auto w-56 h-56 mb-6 flex items-center justify-center">
        <svg width="100%" height="100%" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Fondo circular suave */}
          <circle cx="256" cy="256" r="200" fill="#1A1A1A" opacity="0.9" />
          
          {/* Estrella fugaz - cuerpo principal */}
          <path 
            d="M146 166L386 346L356 366L116 186L146 166Z" 
            fill="#333" 
            stroke="#444" 
            strokeWidth="2"
          />
          
          {/* Estela de la estrella */}
          <path 
            d="M386 346L436 396C436 396 416 386 396 386C376 386 356 366 356 366L386 346Z" 
            fill="#444" 
            stroke="#555" 
            strokeWidth="2"
          />
          
          {/* Estrella brillante en la punta */}
          <path 
            d="M146 166L158 138L186 150L158 108L186 96L146 96L134 66L122 96L82 96L110 108L82 150L110 138L146 166Z" 
            fill="#777" 
            stroke="#999" 
            strokeWidth="2"
          />
          
          {/* Círculo central con signo más */}
          <circle 
            cx="256" 
            cy="256" 
            r="40" 
            fill="#333" 
            stroke="#555" 
            strokeWidth="3"
          />
          <path 
            d="M236 256H276M256 236V276" 
            stroke="#999" 
            strokeWidth="6" 
            strokeLinecap="round"
          />
          
          {/* Destellos pequeños */}
          <circle cx="200" cy="200" r="6" fill="#666" />
          <circle cx="300" cy="320" r="8" fill="#666" />
          <circle cx="180" cy="330" r="5" fill="#666" />
          <circle cx="320" cy="180" r="7" fill="#666" />
          
          {/* Destellos lineales */}
          <path d="M226 226L246 246" stroke="#666" strokeWidth="3" strokeLinecap="round" />
          <path d="M266 266L286 286" stroke="#666" strokeWidth="3" strokeLinecap="round" />
          <path d="M226 286L246 266" stroke="#666" strokeWidth="3" strokeLinecap="round" />
          <path d="M266 246L286 226" stroke="#666" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="font-medium text-xl text-white mb-2">Tu lista de deseos está vacía</h3>
      <p className="text-white mb-6">Añade tu primer deseo para empezar a compartir con tus amigos</p>
      <button 
        onClick={onAddWish}
        className="btn-airbnb"
      >
        Añadir deseo
      </button>
    </div>
  );
};

export default EmptyWishlist;
