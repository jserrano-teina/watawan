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
          <circle cx="256" cy="256" r="200" fill="url(#gradient)" opacity="0.8" />
          
          {/* Lista con items */}
          <rect x="136" y="156" width="240" height="200" rx="16" fill="#2A2A2A" stroke="#555" strokeWidth="2" />
          
          {/* Líneas de lista */}
          <rect x="160" y="196" width="192" height="12" rx="6" fill="#555" />
          <rect x="160" y="236" width="192" height="12" rx="6" fill="#555" />
          <rect x="160" y="276" width="192" height="12" rx="6" fill="#555" />
          <rect x="160" y="316" width="120" height="12" rx="6" fill="#555" />
          
          {/* Encabezado de lista */}
          <rect x="136" y="156" width="240" height="24" rx="8" fill="#444" />
          <rect x="160" y="162" width="80" height="12" rx="6" fill="#666" />
          
          {/* Corazón para indicar lista de deseos */}
          <path d="M370 230C370 230 350 210 330 230C310 250 330 280 370 320C410 280 430 250 410 230C390 210 370 230 370 230Z" 
                fill="url(#heartGradient)" />
          
          {/* Estrella para indicar favoritos */}
          <path d="M142 380L150 396L168 400L156 412L158 430L142 422L126 430L128 412L116 400L134 396L142 380Z" 
                fill="url(#starGradient)" />
                
          {/* Signo más para indicar añadir */}
          <circle cx="370" cy="380" r="24" fill="#444" />
          <path d="M360 380H380M370 370V390" stroke="#999" strokeWidth="4" strokeLinecap="round" />
          
          {/* Definición de gradientes */}
          <defs>
            <linearGradient id="gradient" x1="256" y1="56" x2="256" y2="456" gradientUnits="userSpaceOnUse">
              <stop stopColor="#333" />
              <stop offset="1" stopColor="#111" />
            </linearGradient>
            
            <linearGradient id="heartGradient" x1="370" y1="210" x2="370" y2="330" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF4444" />
              <stop offset="1" stopColor="#FF0000" />
            </linearGradient>
            
            <linearGradient id="starGradient" x1="142" y1="380" x2="142" y2="430" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFDD00" />
              <stop offset="1" stopColor="#FFB000" />
            </linearGradient>
          </defs>
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
