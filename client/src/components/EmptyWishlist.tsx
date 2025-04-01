import React from 'react';

interface EmptyWishlistProps {
  onAddWish: () => void;
}

const EmptyWishlist: React.FC<EmptyWishlistProps> = ({ onAddWish }) => {
  return (
    <div className="p-6 text-center max-w-md mx-auto">
      {/* Ilustración inspiracional SVG */}
      <div className="mx-auto w-60 h-60 mb-6 flex items-center justify-center">
        <svg width="100%" height="100%" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Fondo con degradado */}
          <rect width="512" height="512" rx="256" fill="url(#wishGradient)" />
          
          {/* Zapatilla */}
          <path d="M176 335C176 335 180 260 188 245C196 230 206 210 216 210C226 210 241 210 241 210L246 220C246 220 251 225 251 235C251 245 246 335 246 335H176Z" fill="#333" stroke="black" strokeWidth="8" />
          <path d="M176 335H246C246 335 291 335 306 335C321 335 326 325 326 310C326 295 321 280 311 280C301 280 241 280 241 280" stroke="black" strokeWidth="8" />
          <ellipse cx="210" cy="222" rx="15" ry="15" fill="#F9E8B3" stroke="black" strokeWidth="4" />
          
          {/* Cordones */}
          <path d="M195 250C195 250 215 245 225 250" stroke="#F9E8B3" strokeWidth="6" strokeLinecap="round" />
          <path d="M190 270C190 270 215 265 230 270" stroke="#F9E8B3" strokeWidth="6" strokeLinecap="round" />
          <path d="M185 290C185 290 215 285 235 290" stroke="#F9E8B3" strokeWidth="6" strokeLinecap="round" />
          <path d="M180 310C180 310 215 305 240 310" stroke="#F9E8B3" strokeWidth="6" strokeLinecap="round" />
          
          {/* Suela */}
          <path d="M176 335C176 335 176 345 176 350C176 355 176 365 246 365C316 365 326 355 326 350C326 345 326 335 326 335" fill="#F9E8B3" stroke="black" strokeWidth="8" />
          <path d="M246 365C246 365 251 355 251 350C251 345 246 335 246 335" stroke="black" strokeWidth="4" />
          
          {/* Mando */}
          <path d="M210 170C210 170 220 150 260 150C300 150 310 170 310 180C310 190 300 210 260 210C220 210 210 190 210 180C210 170 210 170 210 170Z" fill="#4A7AFF" stroke="black" strokeWidth="8" />
          <circle cx="235" cy="170" r="12" fill="#333" stroke="black" strokeWidth="4" />
          <circle cx="285" cy="170" r="12" fill="#333" stroke="black" strokeWidth="4" />
          <circle cx="260" cy="180" r="10" fill="#333" stroke="black" strokeWidth="4" />
          <path d="M230 160H290" stroke="black" strokeWidth="6" />
          <path d="M220 180H240" stroke="black" strokeWidth="6" />
          
          {/* Botones del mando */}
          <circle cx="275" cy="155" r="5" fill="#F9E8B3" />
          <circle cx="290" cy="155" r="5" fill="#F9E8B3" />
          <circle cx="275" cy="170" r="5" fill="#F9E8B3" />
          <circle cx="290" cy="170" r="5" fill="#F9E8B3" />
          
          {/* Libro */}
          <path d="M320 190L380 160L380 220L320 250L320 190Z" fill="#FF7A00" stroke="black" strokeWidth="8" />
          <path d="M320 190L380 160" stroke="black" strokeWidth="8" />
          <path d="M320 220L380 190" fill="#FFDA83" stroke="#FFDA83" strokeWidth="8" />
          
          {/* Rayos y estrellas decorativas */}
          <path d="M150 180L170 200" stroke="#FFDA83" strokeWidth="4" strokeLinecap="round" />
          <path d="M120 250L140 230" stroke="#FFDA83" strokeWidth="4" strokeLinecap="round" />
          <path d="M370 290L390 310" stroke="#FFDA83" strokeWidth="4" strokeLinecap="round" />
          <path d="M350 250L365 220" stroke="#4A7AFF" strokeWidth="4" strokeLinecap="round" />
          <path d="M160 300L180 320" stroke="#4A7AFF" strokeWidth="4" strokeLinecap="round" />
          
          <path d="M130 350L150 340L160 360L140 370L130 350Z" fill="#FF7A00" />
          <path d="M380 260L395 250L405 270L390 280L380 260Z" fill="#FF7A00" />
          <path d="M400 330L410 360L380 350L390 330L400 330Z" fill="#4A7AFF" />
          
          {/* Gradientes */}
          <defs>
            <radialGradient id="wishGradient" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
              <stop stopColor="#673E00" stopOpacity="0.8" />
              <stop offset="1" stopColor="#261700" stopOpacity="1" />
            </radialGradient>
          </defs>
        </svg>
      </div>
      <h2 className="font-bold text-2xl text-white mb-3">Tu lista de deseos está vacía</h2>
      <p className="text-white/60 mb-6">Añade tus objetos favoritos a tu lista y compártelos con familia y amigos</p>
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
