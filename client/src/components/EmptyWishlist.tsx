import React from 'react';

interface EmptyWishlistProps {
  onAddWish: () => void;
}

const EmptyWishlist: React.FC<EmptyWishlistProps> = ({ onAddWish }) => {
  return (
    <div className="p-6 text-center max-w-md mx-auto">
      {/* Ilustración de deseos - productos deseados */}
      <div className="mx-auto w-64 h-64 mb-6 flex items-center justify-center">
        <svg width="100%" height="100%" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Fondo con destellos */}
          <rect width="500" height="500" rx="8" fill="#121212" />
          
          {/* Destellos amarillos */}
          <path d="M70 90L90 110M180 40L200 60M280 130L300 150M60 220L80 240M350 50L370 70" stroke="#FFA500" strokeWidth="3" strokeLinecap="round" />
          <path d="M80 310L100 330M430 180L450 200M380 300L400 320M200 360L220 380M60 420L80 440" stroke="#FFA500" strokeWidth="3" strokeLinecap="round" />
          
          {/* Estrellas amarillas */}
          <path d="M420 330L430 340L440 330L430 320L420 330Z" fill="#FFA500" />
          <path d="M100 200L110 210L120 200L110 190L100 200Z" fill="#FFA500" />
          <path d="M350 400L360 410L370 400L360 390L350 400Z" fill="#FFA500" />
          
          {/* Destellos azules */}
          <path d="M370 100L390 120M140 120L160 140M400 240L420 260" stroke="#4169E1" strokeWidth="3" strokeLinecap="round" />
          <path d="M130 380L150 400M270 380L290 400" stroke="#4169E1" strokeWidth="3" strokeLinecap="round" />
          
          {/* Zapatilla Converse (principal) */}
          <path d="M250 165C229 165 200 178 190 200C180 222 180 280 190 310C200 340 220 350 250 350C280 350 300 340 310 310C320 280 320 222 310 200C300 178 271 165 250 165Z" fill="#333" stroke="black" strokeWidth="4" />
          <path d="M180 310C190 320 220 325 250 325C280 325 310 320 320 310C320 320 310 340 250 340C190 340 180 320 180 310Z" fill="#444" stroke="black" strokeWidth="2" />
          <path d="M200 340L200 325M220 340L220 325M240 340L240 325M260 340L260 325M280 340L280 325M300 340L300 325" stroke="black" strokeWidth="2" />
          <path d="M180 310C180 310 180 300 190 290C200 280 290 280 310 290C330 300 320 310 320 310" stroke="black" strokeWidth="4" />
          
          {/* Parte frontal y suela */}
          <path d="M180 310C170 300 170 290 180 280C190 270 230 260 250 260C270 260 310 270 320 280C330 290 330 300 320 310" fill="#333" stroke="black" strokeWidth="3" />
          <path d="M180 310C170 320 170 330 180 340C190 350 230 360 250 360C270 360 310 350 320 340C330 330 330 320 320 310" fill="#FFF8DC" stroke="black" strokeWidth="3" />
          <path d="M180 340C180 340 200 345 250 345C300 345 320 340 320 340" fill="#FFEC8B" stroke="black" strokeWidth="2" />
          
          {/* Cordones */}
          <path d="M220 230C230 230 240 230 250 230" stroke="#FFEC8B" strokeWidth="4" strokeLinecap="round" />
          <path d="M220 245C230 245 240 245 250 245" stroke="#FFEC8B" strokeWidth="4" strokeLinecap="round" />
          <path d="M220 260C230 260 240 260 250 260" stroke="#FFEC8B" strokeWidth="4" strokeLinecap="round" />
          <path d="M220 275C230 275 240 275 250 275" stroke="#FFEC8B" strokeWidth="4" strokeLinecap="round" />
          <path d="M220 290C230 290 240 290 250 290" stroke="#FFEC8B" strokeWidth="4" strokeLinecap="round" />
          
          {/* Logo */}
          <circle cx="210" cy="200" r="12" fill="#FFEC8B" stroke="black" strokeWidth="2" />
          
          {/* Control de juego (azul) */}
          <path d="M320 100C310 90 260 90 250 100C240 110 240 130 250 140C260 150 310 150 320 140C330 130 330 110 320 100Z" fill="#4169E1" stroke="black" strokeWidth="3" />
          <path d="M260 100L240 120M285 90L285 120M300 90L300 120M315 90L315 120" stroke="black" strokeWidth="2" />
          <circle cx="265" cy="110" r="5" fill="#FFA500" stroke="black" strokeWidth="1" />
          <circle cx="285" cy="100" r="5" fill="#FFA500" stroke="black" strokeWidth="1" />
          <circle cx="300" cy="105" r="5" fill="#FFA500" stroke="black" strokeWidth="1" />
          <circle cx="315" cy="105" r="5" fill="#FFA500" stroke="black" strokeWidth="1" />
          
          {/* Libro (naranja) */}
          <path d="M350 120L400 130L400 170L350 160Z" fill="#FF8C00" stroke="black" strokeWidth="3" />
          <path d="M350 120L400 130L400 135L350 125Z" fill="#FFA500" stroke="black" strokeWidth="1" />
          <path d="M350 125L400 135L400 140L350 130Z" fill="#FFEC8B" stroke="black" strokeWidth="1" />
        </svg>
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
