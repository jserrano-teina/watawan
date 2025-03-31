import React, { useState } from 'react';
import { User, WishItem } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ReservationModal from './modals/ReservationModal';
import DetailsModal from './modals/DetailsModal';
import ProductImage from './ProductImage';
import { X, ExternalLink, ArrowLeft } from 'lucide-react';

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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WishItem | undefined>(undefined);
  
  // Ordenar los items por fecha de creación (más recientes primero)
  const sortedItems = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
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
      // Solo cerrar el modal de reserva, mantener abierto el modal de detalles
      setShowReservationModal(false);
      
      // Actualizar el item seleccionado para reflejar que ahora está reservado
      const updatedItem = {...selectedItem, isReserved: true};
      setSelectedItem(updatedItem);
    }
  };

  return (
    <div className="flex-grow container mx-auto px-4 pb-20">
      <div className="max-w-[500px] mx-auto w-full">
        <div className="flex flex-col items-center mb-10 pt-16">
          <div className="mb-6">
            {owner.avatar ? (
              <div className="w-24 h-24 rounded-full overflow-hidden">
                <img 
                  src={owner.avatar} 
                  alt={owner.displayName || 'Usuario'}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-800/70 flex items-center justify-center">
                <span className="text-xl font-medium text-white">
                  {owner.initials || owner.displayName?.charAt(0) || owner.email.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-white text-center mb-4">
            Lista de deseos de {owner.displayName || owner.email.split('@')[0]}
          </h1>
        </div>
        
        {items.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-8 text-center my-6">
            <div className="mx-auto w-24 h-24 flex items-center justify-center mb-4">
              <svg width="96" height="96" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/50">
                <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.6316 14.4865C11.2177 14.5023 10.4429 14.1896 9.72255 13.4693C9.00221 12.749 8.6895 11.9741 8.70533 11.5603C8.72116 11.1464 8.81192 11.111 9.25421 11.2756C9.6965 11.4403 10.8507 12.0324 10.9575 12.6563C11.0643 13.2802 12.0456 14.4708 11.6316 14.4865Z" fill="currentColor"/>
                <path d="M13.1258 14.4866C13.5397 14.5023 14.3146 14.1897 15.0349 13.4693C15.7552 12.749 16.068 11.9742 16.0521 11.5603C16.0363 11.1464 15.9455 11.111 15.5032 11.2757C15.0609 11.4403 13.9068 12.0324 13.8 12.6563C13.6932 13.2802 13.1258 14.4866 13.1258 14.4866Z" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">No hay deseos disponibles</h3>
            <p className="text-white/70 text-base max-w-md mx-auto">
              Esta lista está vacía. Puedes revisar más tarde para ver si hay nuevos regalos disponibles.
            </p>
          </div>
        ) : (
          sortedItems.map(item => (
            <div 
              key={item.id} 
              className={`bg-[#1a1a1a] border border-[#333] rounded-lg p-4 my-3 ${item.isReserved ? 'opacity-75' : 'hover:bg-[#252525]'} transition-colors`}
            >
              <div 
                className="flex cursor-pointer" 
                onClick={() => {
                  setSelectedItem(item);
                  setShowDetailsModal(true);
                }}
              >
                {/* Imagen a la izquierda con border radius reducido */}
                <div className="w-20 h-20 bg-[#252525] overflow-hidden mr-4 flex-shrink-0 flex items-center justify-center shadow-sm" style={{ borderRadius: '6px' }}>
                  <ProductImage 
                    imageUrl={item.imageUrl} 
                    productId={getProductId(item.purchaseLink)}
                    title={item.title}
                    purchaseLink={item.purchaseLink}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Contenido a la derecha - Simplificado */}
                <div className="flex-grow min-w-0 flex flex-col justify-center">
                  {/* Tag de reservado */}
                  {item.isReserved && (
                    <span className="px-2 py-0.5 mb-1 bg-green-500/20 text-green-500 text-xs font-medium rounded-full inline-block w-fit">
                      Reservado
                    </span>
                  )}
                  
                  {/* Nombre del producto */}
                  <h3 className="font-semibold text-lg truncate mr-2 text-white">{item.title}</h3>
                  
                  {/* Precio */}
                  {item.price && (
                    <span className="text-white font-medium text-base mt-1">
                      {item.price}
                    </span>
                  )}
                  
                  {/* El tag "Reservado" ya comunica esta información */}
                </div>
              </div>
              
              {/* Botones horizontales (solo para items no reservados) */}
              {!item.isReserved && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button 
                    onClick={() => {
                      setSelectedItem(item);
                      setShowDetailsModal(true);
                    }}
                    className="inline-flex items-center justify-center h-[50px] px-4 rounded-lg border border-[#444] bg-transparent text-white hover:bg-[#2a2a2a] transition-colors"
                  >
                    Ver más
                  </button>
                  <button 
                    onClick={() => handleReserveClick(item)}
                    className="inline-flex items-center justify-center h-[50px] px-4 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    Lo regalaré yo
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <ReservationModal 
        isOpen={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        onConfirm={handleConfirmReservation}
        item={selectedItem}
      />

      <DetailsModal 
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        item={selectedItem || null}
        onReserveClick={() => {
          // Mantener el modal de detalles abierto mientras se muestra el modal de reserva
          setShowReservationModal(true);
        }}
      />
    </div>
  );
};

export default SharedWishlistView;