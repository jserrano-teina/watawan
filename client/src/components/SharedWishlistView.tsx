import React, { useState } from 'react';
import { User, WishItem } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ReservationModal from './modals/ReservationModal';
import ProductImage from './ProductImage';
import { X, ExternalLink, ArrowLeft } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-[var(--color-bg-primary)] overflow-hidden flex flex-col">
      {/* Botón flotante para volver */}
      <button 
        onClick={onClose} 
        className="fixed top-4 left-4 z-30 btn-icon shadow-lg backdrop-blur-sm"
      >
        <ArrowLeft size={20} />
      </button>
      
      {/* Contenido scrolleable */}
      <div className="flex-grow overflow-auto">
        {/* Imagen a sangre al inicio */}
        <div className="w-full h-72 bg-[var(--color-bg-tertiary)] relative">
          <ProductImage 
            imageUrl={item.imageUrl} 
            title={item.title}
            purchaseLink={item.purchaseLink}
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Información del producto */}
        <div className="p-5">
          <h2 className="mb-2.5 leading-tight">{item.title}</h2>
          
          {item.price && (
            <div className="mb-5">
              <span className="text-xl font-semibold text-[var(--color-text-primary)]">{item.price}</span>
            </div>
          )}
          
          <div className="my-4 flex text-sm text-[var(--color-text-tertiary)]">
            <span>Añadido a la lista</span>
          </div>
          
          <div className="mb-5">
            <h3 className="font-medium mb-1.5">Enlace de compra</h3>
            <a 
              href={item.purchaseLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm flex items-center truncate"
            >
              <ExternalLink size={14} className="flex-shrink-0 mr-1.5" />
              <span className="truncate">{item.purchaseLink}</span>
            </a>
          </div>
          
          {item.description && (
            <div className="mb-5">
              <h3 className="font-medium mb-1.5">Descripción</h3>
              <p className="text-sm">{item.description}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Barra inferior fija con botones */}
      <div className="border-t border-[var(--color-border)] p-4 grid grid-cols-2 gap-3">
        <a 
          href={item.purchaseLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-secondary flex items-center justify-center"
        >
          <ExternalLink size={16} className="mr-2" />
          Enlace de compra
        </a>
        <button 
          onClick={onReserveClick}
          className="btn-primary"
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
  
  // Ordenar los items por fecha de creación (más recientes primero) y luego filtrar
  const sortedItems = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const availableItems = sortedItems.filter(item => !item.isReserved);
  const reservedItems = sortedItems.filter(item => item.isReserved);
  
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
      <div className="py-6 text-center border-b border-[var(--color-border)] mb-4">
        <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl font-semibold">
            {owner.initials || owner.displayName?.charAt(0) || 'U'}
          </span>
        </div>
        <h1 className="text-gradient">
          Lista de deseos de {owner.displayName || owner.email.split('@')[0]}
        </h1>
        <p className="mt-2 text-lg">
          Elige un regalo para sorprenderle en su día especial
        </p>
      </div>

      <div className="my-6">
        <h2 className="mb-4">Disponibles para regalar</h2>
        
        {availableItems.length === 0 ? (
          <div className="card p-8 text-center my-6">
            <div className="mx-auto w-24 h-24 flex items-center justify-center mb-4">
              <svg width="96" height="96" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--color-text-muted)]">
                <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.6316 14.4865C11.2177 14.5023 10.4429 14.1896 9.72255 13.4693C9.00221 12.749 8.6895 11.9741 8.70533 11.5603C8.72116 11.1464 8.81192 11.111 9.25421 11.2756C9.6965 11.4403 10.8507 12.0324 10.9575 12.6563C11.0643 13.2802 12.0456 14.4708 11.6316 14.4865Z" fill="currentColor"/>
                <path d="M13.1258 14.4866C13.5397 14.5023 14.3146 14.1897 15.0349 13.4693C15.7552 12.749 16.068 11.9742 16.0521 11.5603C16.0363 11.1464 15.9455 11.111 15.5032 11.2757C15.0609 11.4403 13.9068 12.0324 13.8 12.6563C13.6932 13.2802 13.1258 14.4866 13.1258 14.4866Z" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="text-xl mb-2">No hay deseos disponibles</h3>
            <p className="text-base max-w-md mx-auto">
              Todos los deseos de esta lista ya han sido reservados o no se han añadido elementos aún. 
              Puedes revisar más tarde para ver si hay nuevos regalos disponibles.
            </p>
          </div>
        ) : (
          availableItems.map(item => (
            <div 
              key={item.id} 
              className="card p-4 my-3 hover:bg-[var(--color-bg-tertiary)]"
            >
              <div 
                className="flex cursor-pointer" 
                onClick={() => {
                  setSelectedItem(item);
                  setShowDetailsModal(true);
                }}
              >
                {/* Imagen a la izquierda con border radius reducido */}
                <div className="w-24 h-24 bg-[var(--color-bg-tertiary)] overflow-hidden mr-4 flex-shrink-0 flex items-center justify-center shadow-sm rounded-md">
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
                  <h3 className="truncate">{item.title}</h3>
                  
                  {/* Solo precio */}
                  {item.price && (
                    <span className="font-medium text-[var(--color-text-primary)] mt-1">
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
                  className="btn-secondary"
                >
                  Ver más
                </button>
                <button 
                  onClick={() => handleReserveClick(item)}
                  className="btn-outline text-primary"
                >
                  Lo regalaré yo
                </button>
              </div>
            </div>
          ))
        )}
        
        {reservedItems.length > 0 && (
          <>
            <h2 className="mt-8 mb-4">Ya reservados</h2>
            
            {reservedItems.map(item => (
              <div 
                key={item.id} 
                className="card p-4 my-3 opacity-80"
              >
                <div className="absolute top-1 right-1">
                  <span className="badge badge-success">Reservado</span>
                </div>
                <div className="flex">
                  {/* Imagen a la izquierda con border radius reducido */}
                  <div className="w-24 h-24 bg-[var(--color-bg-tertiary)] overflow-hidden mr-4 flex-shrink-0 flex items-center justify-center shadow-sm rounded-md">
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
                    <h3 className="truncate">{item.title}</h3>
                    
                    {/* Solo precio */}
                    {item.price && (
                      <span className="font-medium text-[var(--color-text-primary)] mt-1">
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
