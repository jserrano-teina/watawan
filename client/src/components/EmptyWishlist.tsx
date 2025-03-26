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
          
          {/* Estela de la estrella */}
          <path 
            d="M156 206L306 356L346.5 396L426 436" 
            stroke="#777" 
            strokeWidth="14" 
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1 28"
            opacity="0.6"
          />
          
          <path 
            d="M136 186L286 336" 
            stroke="#999" 
            strokeWidth="24" 
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.4"
          />
          
          {/* Estrella brillante principal */}
          <path 
            d="M136 186L158 138L196 156L170 106L210 86L150 86L136 46L122 86L62 86L102 106L76 156L114 138L136 186Z" 
            fill="#777" 
            stroke="#999" 
            strokeWidth="2"
          />
          
          {/* Destellos pequeños alrededor */}
          <circle cx="320" cy="320" r="8" fill="#666" />
          <circle cx="380" cy="380" r="6" fill="#666" />
          <circle cx="410" cy="410" r="4" fill="#666" />
          
          {/* Destellos adicionales */}
          <circle cx="200" cy="140" r="5" fill="#888" />
          <circle cx="80" cy="200" r="4" fill="#888" />
          <circle cx="180" cy="80" r="3" fill="#888" />
          
          {/* Destellos alrededor de la estrella */}
          <path d="M106 166L96 156" stroke="#888" strokeWidth="2" strokeLinecap="round" />
          <path d="M166 106L156 96" stroke="#888" strokeWidth="2" strokeLinecap="round" />
          <path d="M166 166L176 176" stroke="#888" strokeWidth="2" strokeLinecap="round" />
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
