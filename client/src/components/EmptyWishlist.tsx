import React from 'react';

interface EmptyWishlistProps {
  onAddWish: () => void;
}

const EmptyWishlist: React.FC<EmptyWishlistProps> = ({ onAddWish }) => {
  return (
    <div className="p-6 text-center max-w-md mx-auto">
      {/* Ilustración inspiracional SVG */}
      <div className="mx-auto w-48 h-48 mb-6 flex items-center justify-center">
        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g opacity="0.8">
            <path d="M19 7H16.6C16.2 5.8 15.7 4.7 15.2 4.2C14.6 3.5 13.6 3 12.5 3C11.5 3 10.4 3.5 9.70001 4.2C9.20001 4.7 8.7 5.8 8.3 7H6C4.9 7 4 7.9 4 9V18C4 19.1 4.9 20 6 20H19C20.1 20 21 19.1 21 18V9C21 7.9 20.1 7 19 7Z" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.5 18C14.9853 18 17 15.9853 17 13.5C17 11.0147 14.9853 9 12.5 9C10.0147 9 8 11.0147 8 13.5C8 15.9853 10.0147 18 12.5 18Z" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.5 16L14 13.5L12.5 11L11 13.5L12.5 16Z" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
        </svg>
      </div>
      <h3 className="font-medium text-2xl text-white mb-3">Crea tu wishlist</h3>
      <p className="text-white/70 mb-8 text-lg">Añade tus deseos y compártelos con amigos y familiares para que sepan qué regalarte</p>
      <button 
        onClick={onAddWish}
        className="btn-airbnb text-lg py-3 px-8"
      >
        Crear mi primer deseo
      </button>
    </div>
  );
};

export default EmptyWishlist;
