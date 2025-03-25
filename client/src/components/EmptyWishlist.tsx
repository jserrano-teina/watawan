import React from 'react';

interface EmptyWishlistProps {
  onAddWish: () => void;
}

const EmptyWishlist: React.FC<EmptyWishlistProps> = ({ onAddWish }) => {
  return (
    <div className="p-6 text-center max-w-md mx-auto">
      {/* Ilustración elaborada con colores neutros */}
      <div className="mx-auto w-64 h-64 mb-6 flex items-center justify-center">
        <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g opacity="0.9">
            {/* Fondo */}
            <circle cx="100" cy="100" r="80" fill="#2A2A2A" opacity="0.3" />
            
            {/* Caja de regalo base */}
            <rect x="60" y="85" width="80" height="60" rx="4" fill="#3A3A3A" />
            <rect x="60" y="75" width="80" height="15" rx="4" fill="#444444" />
            
            {/* Cinta decorativa */}
            <rect x="95" y="65" width="10" height="85" rx="2" fill="#555555" />
            <rect x="50" y="90" width="100" height="10" rx="2" fill="#555555" />
            
            {/* Lazo superior */}
            <path d="M100 60C100 60 90 70 85 65C80 60 85 55 90 55C95 55 100 60 100 60Z" fill="#666666" />
            <path d="M100 60C100 60 110 70 115 65C120 60 115 55 110 55C105 55 100 60 100 60Z" fill="#666666" />
            
            {/* Estrellas decorativas */}
            <path d="M140 50L142 55L147 56L143.5 60L144 65L140 62.5L136 65L136.5 60L133 56L138 55L140 50Z" fill="#777777" />
            <path d="M55 60L57 65L62 66L58.5 70L59 75L55 72.5L51 75L51.5 70L48 66L53 65L55 60Z" fill="#777777" />
            <path d="M130 130L132 135L137 136L133.5 140L134 145L130 142.5L126 145L126.5 140L123 136L128 135L130 130Z" fill="#777777" />
            
            {/* Detalles */}
            <circle cx="85" cy="105" r="5" fill="#222222" />
            <circle cx="115" cy="105" r="5" fill="#222222" />
            <path d="M90 125C90 125 95 130 100 130C105 130 110 125 110 125" stroke="#222222" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
      </div>
      <h3 className="font-medium text-xl text-white mb-2">Tu lista de deseos está vacía</h3>
      <p className="text-white/70 mb-6">Añade tu primer deseo para empezar a compartir con tus amigos</p>
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
