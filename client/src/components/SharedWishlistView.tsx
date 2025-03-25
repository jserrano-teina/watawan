import React, { useState } from 'react';
import { User, WishItem } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ReservationModal from './modals/ReservationModal';
import ProductImage from './ProductImage';
import { X, ExternalLink } from 'lucide-react';

interface SharedWishlistViewProps {
  owner: User;
  items: WishItem[];
  onReserveItem: (itemId: number, reserverName: string) => Promise<void>;
}

// Modal para mostrar detalles del ítem sin permitir edición
interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WishItem | null;
  onReserveClick: () => void;
}

// Componente de modal de detalles
const DetailsModal: React.FC<DetailsModalProps> = ({ isOpen, onClose, item, onReserveClick }) => {
  if (!isOpen || !item) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-[#121212] overflow-hidden flex flex-col">
      {/* Header con botón de cierre */}
      <div className="px-4 py-3 flex items-center border-b border-[#333]">
        <button 
          onClick={onClose} 
          className="text-white mr-2"
        >
          <X size={24} />
        </button>
        <h2 className="text-lg font-semibold text-white flex-grow">Detalles del regalo</h2>
      </div>
      
      {/* Contenido scrolleable */}
      <div className="flex-grow overflow-auto">
        {/* Imagen a pantalla completa */}
        <div className="w-full h-72 bg-[#1a1a1a] relative">
          <ProductImage 
            imageUrl={item.imageUrl} 
            title={item.title}
            purchaseLink={item.purchaseLink}
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Información del producto */}
        <div className="p-5">
          <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
          
          {item.price && (
            <div className="mb-4">
              <span className="text-white font-semibold text-xl">{item.price}</span>
            </div>
          )}
          
          {item.description && (
            <div className="mb-6">
              <h4 className="text-sm text-white/70 mb-2">Descripción</h4>
              <p className="text-white text-base">{item.description}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Barra inferior fija con botones */}
      <div className="border-t border-[#333] p-4 grid grid-cols-2 gap-3">
        <a 
          href={item.purchaseLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-[#252525] text-white flex items-center justify-center py-3 px-4 rounded-md font-medium text-center hover:bg-[#333] transition-colors"
        >
          <ExternalLink size={16} className="mr-2" />
          Enlace de compra
        </a>
        <button 
          onClick={onReserveClick}
          className="bg-primary text-white py-3 px-4 rounded-md font-medium text-center hover:bg-primary/90 transition-colors"
        >
          Lo regalaré yo
        </button>
      </div>
    </div>
  );
}

const SharedWishlistView: React.FC<SharedWishlistViewProps> = ({ 
  owner, 
  items,
  onReserveItem
}) => {
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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
      <div className="py-6 text-center border-b border-[#333] mb-4">
        <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl font-semibold text-white">
            {owner.initials || owner.displayName?.charAt(0) || 'U'}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">
          Lista de deseos de {owner.displayName || owner.username}
        </h1>
        <p className="text-white/70 mt-2 text-lg">
          Elige un regalo para sorprenderle en su día especial
        </p>
      </div>

      <div className="my-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Disponibles para regalar</h2>
        
        {availableItems.length === 0 ? (
          <div className="bg-[#1e1e1e] rounded-xl p-8 text-center my-6 shadow-md border border-[#333]">
            <div className="mx-auto w-24 h-24 flex items-center justify-center mb-4">
              <svg width="96" height="96" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/30">
                <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.6316 14.4865C11.2177 14.5023 10.4429 14.1896 9.72255 13.4693C9.00221 12.749 8.6895 11.9741 8.70533 11.5603C8.72116 11.1464 8.81192 11.111 9.25421 11.2756C9.6965 11.4403 10.8507 12.0324 10.9575 12.6563C11.0643 13.2802 12.0456 14.4708 11.6316 14.4865Z" fill="currentColor"/>
                <path d="M13.1258 14.4866C13.5397 14.5023 14.3146 14.1897 15.0349 13.4693C15.7552 12.749 16.068 11.9742 16.0521 11.5603C16.0363 11.1464 15.9455 11.111 15.5032 11.2757C15.0609 11.4403 13.9068 12.0324 13.8 12.6563C13.6932 13.2802 13.1258 14.4866 13.1258 14.4866Z" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="font-semibold text-xl text-white mb-2">No hay deseos disponibles</h3>
            <p className="text-white/70 text-base max-w-md mx-auto">
              Todos los deseos de esta lista ya han sido reservados o no se han añadido elementos aún. 
              Puedes revisar más tarde para ver si hay nuevos regalos disponibles.
            </p>
          </div>
        ) : (
          availableItems.map(item => (
            <div 
              key={item.id} 
              className="bg-[#1e1e1e] rounded-xl p-4 my-2 relative hover:bg-[#262626] transition-colors shadow-md"
            >
              <div 
                className="flex cursor-pointer" 
                onClick={() => {
                  setSelectedItem(item);
                  setShowDetailsModal(true);
                }}
              >
                {/* Imagen a la izquierda con border radius reducido */}
                <div className="w-24 h-24 bg-[#252525] overflow-hidden mr-4 flex-shrink-0 flex items-center justify-center shadow-sm" style={{ borderRadius: '6px' }}>
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
                  {/* Nombre del producto con mayor tamaño y peso */}
                  <h3 className="font-semibold text-lg truncate text-white">{item.title}</h3>
                  
                  {/* Solo precio */}
                  {item.price && (
                    <span className="text-white font-medium text-base mt-1">
                      {item.price}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Botones horizontales */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button 
                  onClick={() => {
                    setSelectedItem(item);
                    setShowDetailsModal(true);
                  }}
                  className="bg-[#252525] hover:bg-[#333] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Ver más
                </button>
                <button 
                  onClick={() => handleReserveClick(item)}
                  className="bg-[#252525] hover:bg-[#333] text-primary px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Lo regalaré yo
                </button>
              </div>
            </div>
          ))
        )}
        
        {reservedItems.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mt-8 mb-4 text-white">Ya reservados</h2>
            
            {reservedItems.map(item => (
              <div 
                key={item.id} 
                className="bg-[#1e1e1e] rounded-xl p-4 my-2 relative opacity-80 shadow-md"
              >
                <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-md">
                  Reservado
                </div>
                <div className="flex">
                  {/* Imagen a la izquierda con border radius reducido */}
                  <div className="w-24 h-24 bg-[#252525] overflow-hidden mr-4 flex-shrink-0 flex items-center justify-center shadow-sm" style={{ borderRadius: '6px' }}>
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
                    {/* Nombre del producto con mayor tamaño y peso */}
                    <h3 className="font-semibold text-lg truncate text-white">{item.title}</h3>
                    
                    {/* Solo precio */}
                    {item.price && (
                      <span className="text-white font-medium text-base mt-1">
                        {item.price}
                      </span>
                    )}
                    
                    <p className="text-green-500 text-sm flex items-center font-medium mt-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      Alguien ya se encargará de este regalo
                    </p>
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

      <DetailsModal 
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        item={selectedItem || null}
        onReserveClick={() => {
          setShowDetailsModal(false);
          setShowReservationModal(true);
        }}
      />
    </div>
  );
};

export default SharedWishlistView;
