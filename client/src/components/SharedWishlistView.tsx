import React, { useState } from 'react';
import { User, WishItem } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ReservationModal from './modals/ReservationModal';
import DetailsModal from './modals/DetailsModal';
import ProductImage from './ProductImage';
import { X, ExternalLink, ArrowLeft, Lock as LockIcon } from 'lucide-react';

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
  const [priceFilter, setPriceFilter] = useState<string>("Todo");
  
  // Función para extraer un número de precio de una cadena (ej: "32,99€" -> 32.99)
  const extractPriceNumber = (priceString?: string): number => {
    if (!priceString) return 0;
    // Extraer números, puntos y comas del string
    const numStr = priceString.replace(/[^0-9,\.]/g, '');
    // Reemplazar comas por puntos y convertir a número
    return parseFloat(numStr.replace(',', '.')) || 0;
  };

  // Filtrar items por rango de precio
  const filterItemsByPrice = (items: WishItem[]): WishItem[] => {
    if (priceFilter === "Todo") return items;
    
    return items.filter(item => {
      const price = extractPriceNumber(item.price);
      
      switch (priceFilter) {
        case "Hasta 30€":
          return price > 0 && price <= 30;
        case "30 - 60€":
          return price > 30 && price <= 60;
        case "60 - 100€":
          return price > 60 && price <= 100;
        case "+ 100€":
          return price > 100;
        default:
          return true;
      }
    });
  };

  // Ordenar los items por fecha de creación (más recientes primero) y aplicar filtro por precio
  const sortedItems = filterItemsByPrice([...items].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ));
  
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
    <>
      {/* Banner flotante superior */}
      <div className="fixed top-0 left-0 right-0 bg-[#1a1a1a] border-b border-[#333] py-3 px-4 z-[100]">
        <div className="flex items-center justify-center mx-auto">
          <a 
            href="/auth" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center text-white hover:text-white/90 transition"
          >
            <span className="text-sm md:text-base font-medium">Crea y comparte tu lista con</span>
            <img 
              src="/images/waw_logo.svg" 
              alt="WataWan" 
              className="h-7 ml-2"
            />
          </a>
        </div>
      </div>
      
      {/* Contenido principal con margen superior para el banner */}
      <div className="flex-grow container mx-auto px-4 pb-20 pt-16">
      <div className="max-w-[500px] mx-auto w-full">
        <div className="flex flex-col items-center mb-5 pt-10">
          <div className="mb-4">
            {owner.avatar ? (
              <div className="w-24 h-24 rounded-full overflow-hidden">
                <img 
                  src={owner.avatar} 
                  alt={owner.displayName || 'Usuario'}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#252525] flex items-center justify-center">
                <span className="text-xl font-medium text-[#5883C6]">
                  {owner.initials || owner.displayName?.charAt(0) || owner.email.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-white text-center mb-2">
            Lista de deseos de {owner.displayName || owner.email.split('@')[0]}
          </h1>
        </div>

        {/* Botones de filtro por precio */}
        {items.length > 0 && (
          <div className="mb-4 -mx-4">
            <div className="overflow-x-auto px-4 pb-2 scrollbar-none">
              <div className="flex space-x-2 w-max min-w-full">
                {["Todo", "Hasta 30€", "30 - 60€", "60 - 100€", "+ 100€"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setPriceFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                      priceFilter === filter 
                        ? 'bg-primary text-black font-medium border border-primary' 
                        : 'bg-[#1a1a1a] border border-[#333] text-white/80 hover:bg-[#252525]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {items.length === 0 ? (
          <div className="p-6 text-center mt-12 mb-6 flex flex-col justify-center items-center min-h-[400px]">
            <div className="mx-auto w-60 h-60 mb-8 flex items-center justify-center">
              <img 
                src="/images/eyes.png" 
                alt="Lista vacía" 
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-xl font-semibold text-white">Esta lista está vacía</h3>
            <p className="text-white/70 text-base max-w-md mx-auto mt-2">
              Comprueba más tarde si esta persona ha añadido nuevos deseos.
            </p>
          </div>
        ) : sortedItems.length === 0 ? (
          // Mensaje cuando no hay resultados para el filtro aplicado
          <div className="p-6 text-center my-6 flex flex-col justify-center items-center min-h-[400px]">
            <div className="mx-auto w-60 h-60 mb-6 flex items-center justify-center">
              <img 
                src="/images/money.png" 
                alt="Sin resultados" 
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-xl font-semibold text-white">No hay regalos disponibles en este rango de precio</h3>
          </div>
        ) : (
          sortedItems.map(item => (
            <div 
              key={item.id} 
              className={`bg-[#1a1a1a] border border-[#333] rounded-lg p-4 my-3 ${item.isReserved ? 'opacity-75' : 'hover:bg-[#252525]'} transition-colors relative`}
            >
              {/* Icono de enlace externo (solo para items no reservados con enlace) */}
              {!item.isReserved && item.purchaseLink && item.purchaseLink.trim() !== "" && (
                <a 
                  href={item.purchaseLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-[#1a1a1a] hover:bg-[#252525] transition-colors z-10"
                >
                  <ExternalLink size={16} className="text-[#FFE066]" />
                </a>
              )}
              
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
                    <span className="px-2 py-0.5 mb-1 bg-[#5883C6]/30 text-[#89AADC] text-xs font-medium rounded-full inline-block w-fit">
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
                    Ver detalles
                  </button>
                  <button 
                    onClick={() => handleReserveClick(item)}
                    className="inline-flex items-center justify-center h-[50px] px-4 rounded-lg border border-[#444] bg-transparent text-white hover:bg-[#2a2a2a] transition-colors"
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
    </>
  );
};

export default SharedWishlistView;