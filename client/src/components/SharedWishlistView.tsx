import React, { useState, useEffect } from 'react';
import { User, WishItem } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ReservationModal from './modals/ReservationModal';
import DetailsModal from './modals/DetailsModal';
import ProductImage from './ProductImage';
import { X, ExternalLink, ArrowLeft, Lock as LockIcon } from 'lucide-react';
import { sanitizeInput, sanitizeUrl } from '@/lib/sanitize';
import { SanitizedHTML } from '@/components/ui/SanitizedHTML';
import { SafeLink } from '@/components/ui/SafeLink';

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
  const [registerUrl, setRegisterUrl] = useState("/auth");
  
  // Determinar la URL de registro correcta en función del entorno actual
  useEffect(() => {
    // Verificamos si estamos en un entorno de iframe compartido 
    // o en la aplicación principal
    const inIframe = () => {
      try {
        return window !== window.parent;
      } catch (e) {
        return true; // Si hay un error al acceder a window.parent, estamos en un iframe cross-origin
      }
    };
    
    const isEmbedded = inIframe();
    
    // Detectamos el entorno de ejecución
    const hostname = window.location.hostname;
    const isProduction = hostname.includes('.replit.app') || hostname.includes('watawan.app');
    
    let targetUrl = '/auth'; // Valor por defecto para desarrollo local
    
    if (isProduction) {
      // En producción, usar el dominio completo de la app
      targetUrl = 'https://app.watawan.com/auth';
    }
    
    setRegisterUrl(targetUrl);
  }, []);
  
  // Abre el modal de reserva para un item
  const handleReserveClick = (item: WishItem) => {
    setSelectedItem(item);
    setShowReservationModal(true);
  };
  
  // Abre el modal de detalles para un item
  const handleDetailsClick = (item: WishItem) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };
  
  // Confirma la reserva de un item
  const handleConfirmReservation = async (reserverName: string) => {
    if (!selectedItem) return;
    
    try {
      await onReserveItem(selectedItem.id, reserverName);
      // Actualizar el estado del item sin necesidad de recargar la página
      const updatedItems = items.map(item => {
        if (item.id === selectedItem.id) {
          return { ...item, isReserved: true, reserverName };
        }
        return item;
      });
      
      // Cerrar el modal
      setShowReservationModal(false);
    } catch (error) {
      console.error('Error reserving item:', error);
    }
  };
  
  // Filtra los items según el precio seleccionado
  const filteredItems = items.filter(item => {
    if (priceFilter === "Todo") return true;
    
    if (!item.price) {
      return priceFilter === "Sin precio";
    }
    
    const price = parseFloat(item.price.replace(/[^\d.-]/g, ''));
    
    switch (priceFilter) {
      case "< 30€":
        return price < 30;
      case "30€ - 100€":
        return price >= 30 && price <= 100;
      case "> 100€":
        return price > 100;
      default:
        return true;
    }
  });
  
  return (
    <div className="p-4 max-w-[500px] w-full mx-auto bg-[#121212] text-white min-h-screen">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center mr-3">
            {owner.avatar ? (
              <img 
                src={owner.avatar} 
                alt={owner.displayName || 'Usuario'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold">{owner.initials || '?'}</span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{owner.displayName || 'Usuario'}</h1>
            <p className="text-sm text-gray-400">Lista de deseos</p>
          </div>
        </div>
        
        <a href={registerUrl} className="text-sm text-primary underline">
          Crear mi lista
        </a>
      </div>
      
      {/* Filtros */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Filtrar por precio:</h2>
        <div className="flex gap-2 flex-wrap">
          {["Todo", "< 30€", "30€ - 100€", "> 100€", "Sin precio"].map(filter => (
            <button
              key={filter}
              className={`px-3 py-1 rounded-full text-sm ${
                priceFilter === filter
                  ? 'bg-primary text-black font-medium'
                  : 'bg-gray-800 text-gray-300'
              }`}
              onClick={() => setPriceFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      
      {/* Lista de deseos */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-400">No hay elementos que coincidan con el filtro seleccionado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={`relative bg-[#1E1E1E] rounded-lg overflow-hidden ${
                item.isReserved ? 'border border-[#89AADC]' : ''
              }`}
            >
              {/* Indicador de reservado */}
              {item.isReserved && (
                <div className="absolute top-0 left-0 right-0 bg-[#89AADC] text-[#121212] py-1 px-3 text-center text-sm font-medium z-10 flex items-center justify-center">
                  <LockIcon className="w-4 h-4 mr-1" />
                  Reservado por {item.reserverName || 'Alguien'}
                </div>
              )}
              
              <div className="flex flex-col h-full">
                {/* Imagen del producto */}
                <div className="relative w-full h-40 overflow-hidden">
                  <ProductImage 
                    purchaseLink={item.purchaseLink}
                    imageUrl={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Información del producto */}
                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="font-medium text-lg mb-1">
                    {sanitizeInput(item.title)}
                  </h3>
                  
                  {item.price && (
                    <p className="text-primary font-medium mb-3">{item.price}</p>
                  )}
                  
                  {/* Botones de acción */}
                  <div className="flex gap-2 mt-auto">
                    <button
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-gray-800 text-white"
                      onClick={() => handleDetailsClick(item)}
                    >
                      <span>Ver detalles</span>
                    </button>
                    
                    <SafeLink 
                      href={sanitizeUrl(item.purchaseLink)} 
                      className="py-2 px-3 rounded-lg bg-gray-800 text-white flex items-center"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </SafeLink>
                    
                    <button
                      className={`flex-1 py-2 rounded-lg ${
                        item.isReserved
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-primary text-black font-medium'
                      }`}
                      onClick={() => !item.isReserved && handleReserveClick(item)}
                      disabled={item.isReserved}
                    >
                      {item.isReserved ? 'Reservado' : 'Reservar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal de detalles */}
      {showDetailsModal && selectedItem && (
        <DetailsModal
          item={selectedItem}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
      
      {/* Modal de reserva */}
      {showReservationModal && selectedItem && (
        <ReservationModal
          item={selectedItem}
          onClose={() => setShowReservationModal(false)}
          onConfirm={handleConfirmReservation}
        />
      )}
    </div>
  );
};

export default SharedWishlistView;