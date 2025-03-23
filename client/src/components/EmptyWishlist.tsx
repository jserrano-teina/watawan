import React from 'react';

interface EmptyWishlistProps {
  onAddWish: () => void;
}

const EmptyWishlist: React.FC<EmptyWishlistProps> = ({ onAddWish }) => {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center my-4">
      <div className="mx-auto w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
        <i className="fas fa-gift text-2xl text-neutral-700"></i>
      </div>
      <h3 className="font-medium text-lg text-neutral-800">Tu lista de deseos está vacía</h3>
      <p className="text-neutral-600 mt-2 mb-4">Añade tu primer deseo para empezar a compartir con tus amigos</p>
      <button 
        onClick={onAddWish}
        className="bg-primary text-white px-4 py-2 rounded-lg font-medium"
      >
        Añadir deseo
      </button>
    </div>
  );
};

export default EmptyWishlist;
