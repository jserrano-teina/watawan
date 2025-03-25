import React from 'react';

interface EmptyWishlistProps {
  onAddWish: () => void;
}

const EmptyWishlist: React.FC<EmptyWishlistProps> = ({ onAddWish }) => {
  return (
    <div className="p-6 text-center max-w-md mx-auto">
      {/* Ilustración inspiracional SVG */}
      <div className="mx-auto w-48 h-48 mb-6 flex items-center justify-center">
        <svg width="100%" height="100%" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g opacity="0.9">
            {/* Base circular */}
            <circle cx="256" cy="256" r="200" fill="#1A1A1A" />
            
            {/* Detalles decorativos */}
            <path d="M296 146L356 206M356 146L296 206" stroke="#777" strokeWidth="6" strokeLinecap="round" />
            <path d="M156 146L216 206M216 146L156 206" stroke="#777" strokeWidth="6" strokeLinecap="round" />
            
            {/* Caja de regalo - base */}
            <rect x="176" y="206" width="160" height="160" rx="8" fill="#2A2A2A" />
            
            {/* Detalles de la caja */}
            <rect x="176" y="246" width="160" height="10" fill="#333" />
            <rect x="256" y="206" width="10" height="160" fill="#333" />
            
            {/* Lazo */}
            <path d="M266 196C266 196 296 166 316 186C336 206 306 236 306 236" stroke="#666" strokeWidth="8" strokeLinecap="round" />
            <path d="M246 196C246 196 216 166 196 186C176 206 206 236 206 236" stroke="#666" strokeWidth="8" strokeLinecap="round" />
            
            {/* Estrella en el centro */}
            <path d="M256 306L268 330L296 334L276 354L280 380L256 368L232 380L236 354L216 334L244 330L256 306Z" fill="#555" />
            
            {/* Detalles brillantes */}
            <circle cx="210" cy="226" r="4" fill="#999" />
            <circle cx="302" cy="226" r="4" fill="#999" />
            <circle cx="210" cy="286" r="4" fill="#999" />
            <circle cx="302" cy="286" r="4" fill="#999" />
            
            {/* Sombra suave */}
            <circle cx="256" cy="390" r="16" fill="#111" opacity="0.6" />
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
