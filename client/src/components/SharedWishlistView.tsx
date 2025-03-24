import React, { useState } from 'react';
import { User, WishItem } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ReservationModal from './modals/ReservationModal';
import ProductImage from './ProductImage';

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
  
  // Extraer ASIN/ID de producto de URLs de Amazon
  const getProductId = (url?: string): string | undefined => {
    if (!url) return undefined;
    
    // Extraer ASIN de URLs de Amazon
    if (url.includes('amazon')) {
      const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})(?:\/|\?|$)/);
      if (asinMatch && asinMatch[1]) {
        return asinMatch[1];
      }
      
      // Intentar otro formato de URL de Amazon
      const altMatch = url.match(/\/([A-Z0-9]{10})(?:\/|\?|$)/);
      if (altMatch && altMatch[1]) {
        return altMatch[1];
      }
    }
    return undefined;
  };
  
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
      <div className="py-6 text-center border-b border-[#333]">
        <div className="w-20 h-20 rounded-full bg-[#333] mx-auto mb-3 flex items-center justify-center">
          <span className="text-xl font-medium text-white">
            {owner.initials || owner.displayName?.charAt(0) || 'U'}
          </span>
        </div>
        <h1 className="text-xl font-semibold text-white">
          Lista de deseos de {owner.displayName || owner.username}
        </h1>
        <p className="text-white/70 mt-1">
          Elige un regalo para sorprenderle en su día especial
        </p>
      </div>

      <div className="my-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Disponibles para regalar</h2>
        
        {availableItems.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-lg border border-[#333] p-6 text-center my-4">
            <div className="mx-auto w-16 h-16 bg-[#252525] rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50"><path d="M12 22v-8"/><path d="M20 8.5V7a2 2 0 0 0-2-2h-4l-2-3h-4l-2 3H2a2 2 0 0 0-2 2v1.5"/><path d="M16 19a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v7"/><path d="M12 22v-8"/><path d="M22 11v8a2 2 0 0 1-2 2h-2v-6.5"/><rect width="9" height="3" x="7.5" y="10.5"/></svg>
            </div>
            <h3 className="font-medium text-lg text-white">No hay deseos disponibles</h3>
            <p className="text-white/70 mt-2">Todos los deseos han sido reservados o no se han añadido elementos a esta lista.</p>
          </div>
        ) : (
          availableItems.map(item => (
            <div key={item.id} className="bg-[#1a1a1a] rounded-lg border border-[#333] p-3 my-2 relative">
              <div className="flex items-center">
                {/* Imagen a la izquierda */}
                <div className="w-16 h-16 bg-[#252525] rounded-lg overflow-hidden mr-3 flex-shrink-0 flex items-center justify-center">
                  <ProductImage 
                    imageUrl={item.imageUrl} 
                    productId={getProductId(item.purchaseLink)}
                    title={item.title}
                    purchaseLink={item.purchaseLink}
                  />
                </div>
                
                {/* Contenido a la derecha */}
                <div className="flex-grow min-w-0">
                  <h3 className="font-medium text-base truncate text-white">{item.title}</h3>
                  
                  {/* Descripción y precio */}
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.description && (
                      <p className="text-white/60 text-xs line-clamp-1">{item.description}</p>
                    )}
                    {item.price && (
                      <span className="text-primary font-medium text-xs bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {item.price}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <a 
                      href={item.purchaseLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 hover:underline text-xs flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                      Ver enlace
                    </a>
                    <button 
                      onClick={() => handleReserveClick(item)}
                      className="bg-primary text-white px-3 py-1 rounded text-xs flex-shrink-0 hover:bg-primary/80 transition-colors"
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
            <h2 className="text-xl font-semibold mt-8 mb-4 text-white">Ya reservados</h2>
            
            {reservedItems.map(item => (
              <div key={item.id} className="bg-[#1a1a1a] rounded-lg border border-[#333] p-3 my-2 relative opacity-75">
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-0.5 rounded-bl-lg">
                  Reservado
                </div>
                <div className="flex items-center">
                  {/* Imagen a la izquierda */}
                  <div className="w-16 h-16 bg-[#252525] rounded-lg overflow-hidden mr-3 flex-shrink-0 flex items-center justify-center">
                    <ProductImage 
                      imageUrl={item.imageUrl} 
                      productId={getProductId(item.purchaseLink)}
                      title={item.title}
                      purchaseLink={item.purchaseLink}
                    />
                  </div>
                  
                  {/* Contenido a la derecha */}
                  <div className="flex-grow min-w-0">
                    <h3 className="font-medium text-base truncate text-white">{item.title}</h3>
                    
                    {/* Descripción y precio */}
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.description && (
                        <p className="text-white/60 text-xs line-clamp-1">{item.description}</p>
                      )}
                      {item.price && (
                        <span className="text-primary font-medium text-xs bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {item.price}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-green-500 text-xs flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
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
