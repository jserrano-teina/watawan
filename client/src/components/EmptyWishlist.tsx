import React from 'react';

interface EmptyWishlistProps {
  onAddWish: () => void;
}

const EmptyWishlist: React.FC<EmptyWishlistProps> = ({ onAddWish }) => {
  return (
    <div className="card-airbnb p-6 text-center my-4">
      <div className="mx-auto w-16 h-16 bg-[#252525] rounded-full flex items-center justify-center mb-4">
        <i className="fas fa-gift text-2xl text-white/80"></i>
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
