import React, { useState } from 'react';
import { User, WishItem } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ReservationModal from './modals/ReservationModal';

interface SharedWishlistViewProps {
  owner: User;
  items: WishItem[];
  onReserveItem: (itemId: number, reserverName: string) => Promise<void>;
}

const SharedWishlistView: React.FC<SharedWishlistViewProps> = ({ 
  owner, 
  items,
  onReserveItem
}) => {
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WishItem | undefined>(undefined);
  
  const availableItems = items.filter(item => !item.isReserved);
  const reservedItems = items.filter(item => item.isReserved);
  
  const handleReserveClick = (item: WishItem) => {
    setSelectedItem(item);
    setShowReservationModal(true);
  };
  
  const handleConfirmReservation = async (reserverName: string) => {
    if (selectedItem) {
      await onReserveItem(selectedItem.id, reserverName);
      setShowReservationModal(false);
    }
  };

  return (
    <div className="flex-grow container mx-auto px-4 pb-20">
      <div className="py-6 text-center border-b border-neutral-200">
        <div className="w-20 h-20 rounded-full bg-neutral-200 mx-auto mb-3 flex items-center justify-center">
          <span className="text-xl font-medium text-neutral-600">
            {owner.initials || owner.displayName?.charAt(0) || 'U'}
          </span>
        </div>
        <h1 className="text-xl font-semibold">
          Lista de deseos de {owner.displayName || owner.username}
        </h1>
        <p className="text-neutral-600 mt-1">
          Elige un regalo para sorprenderle en su día especial
        </p>
      </div>

      <div className="my-6">
        <h2 className="text-xl font-semibold mb-4">Disponibles para regalar</h2>
        
        {availableItems.length === 0 ? (
          <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center my-4">
            <div className="mx-auto w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-gift text-2xl text-neutral-400"></i>
            </div>
            <h3 className="font-medium text-lg text-neutral-800">No hay deseos disponibles</h3>
            <p className="text-neutral-600 mt-2">Todos los deseos han sido reservados o no se han añadido elementos a esta lista.</p>
          </div>
        ) : (
          availableItems.map(item => (
            <div key={item.id} className="bg-white rounded-lg border border-neutral-200 p-4 my-4 relative">
              <div className="flex md:items-center flex-col md:flex-row">
                <div className="w-full md:w-24 h-24 bg-neutral-100 rounded-lg overflow-hidden mr-0 md:mr-4 mb-4 md:mb-0 flex-shrink-0 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <i className="fas fa-gift text-neutral-400 text-4xl"></i>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="font-medium text-lg">{item.title}</h3>
                  <p className="text-neutral-600 text-sm mt-1">{item.description}</p>
                  <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                    <a 
                      href={item.purchaseLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-secondary hover:underline text-sm"
                    >
                      <i className="fas fa-external-link-alt mr-1"></i>
                      Ver enlace de compra
                    </a>
                    <button 
                      onClick={() => handleReserveClick(item)}
                      className="bg-primary text-white px-4 py-2 rounded-lg text-sm mt-3 sm:mt-0"
                    >
                      Lo regalaré yo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {reservedItems.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mt-8 mb-4">Ya reservados</h2>
            
            {reservedItems.map(item => (
              <div key={item.id} className="bg-white rounded-lg border border-neutral-200 p-4 my-4 relative opacity-75">
                <div className="absolute top-0 right-0 bg-success text-white text-xs px-2 py-1 rounded-bl-lg">
                  Reservado
                </div>
                <div className="flex md:items-center flex-col md:flex-row">
                  <div className="w-full md:w-24 h-24 bg-neutral-100 rounded-lg overflow-hidden mr-0 md:mr-4 mb-4 md:mb-0 flex-shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <i className="fas fa-gift text-neutral-400 text-4xl"></i>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium text-lg">{item.title}</h3>
                    <p className="text-neutral-600 text-sm mt-1">{item.description}</p>
                    <div className="mt-3">
                      <p className="text-neutral-500 text-sm italic">
                        <i className="fas fa-check-circle text-success mr-1"></i>
                        Alguien ya se encargará de este regalo
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      
      <ReservationModal 
        isOpen={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        onConfirm={handleConfirmReservation}
        item={selectedItem}
      />
    </div>
  );
};

export default SharedWishlistView;
