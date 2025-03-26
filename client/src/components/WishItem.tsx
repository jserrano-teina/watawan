import React, { useState } from 'react';
import { WishItem as WishItemType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ProductImage from './ProductImage';
import { MoreVertical } from 'lucide-react';
import ActionToast from './ActionToast';

interface WishItemProps {
  item: WishItemType;
  onEdit: (item: WishItemType) => void;
  onDelete: (item: WishItemType) => void;
  onClick?: (item: WishItemType) => void;
}

const WishItem: React.FC<WishItemProps> = ({ item, onEdit, onDelete, onClick }) => {
  const [showActionToast, setShowActionToast] = useState(false);
  
  const formattedDate = formatDistanceToNow(new Date(item.createdAt), { 
    addSuffix: true,
    locale: es
  });
  
  // Extraer ASIN de Amazon si está disponible
  const getProductId = (): string | undefined => {
    if (!item.purchaseLink) return undefined;
    
    // Extraer ASIN de URLs de Amazon
    if (item.purchaseLink.includes('amazon')) {
      const asinMatch = item.purchaseLink.match(/\/dp\/([A-Z0-9]{10})(?:\/|\?|$)/);
      if (asinMatch && asinMatch[1]) {
        return asinMatch[1];
      }
    }
    return undefined;
  };

  const productId = getProductId();

  // Función para manejar el clic en el ítem
  const handleItemClick = (e: React.MouseEvent) => {
    // Evitar que se abra el modal si se hace clic en los botones o en el enlace
    if (
      (e.target as HTMLElement).closest('button') || 
      (e.target as HTMLElement).closest('a') ||
      (e.target as HTMLElement).closest('.menu-container')
    ) {
      return;
    }
    
    if (onClick) {
      onClick(item);
    }
  };
  
  // Función para mostrar el toast de acciones
  const handleShowActions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActionToast(true);
  };
  
  // Función para cerrar el toast
  const handleCloseToast = () => {
    setShowActionToast(false);
  };

  return (
    <>
      <div 
        className="bg-[#1e1e1e] rounded-xl p-4 my-0.5 relative cursor-pointer hover:bg-[#262626] transition-colors shadow-md border border-[#2c2c2c]"
        onClick={handleItemClick}
      >
        <div className="flex">
          {/* Imagen a la izquierda con border radius reducido y altura reducida */}
          <div className="w-20 h-20 bg-[#252525] rounded overflow-hidden mr-4 flex-shrink-0 flex items-center justify-center shadow-sm" style={{ borderRadius: '6px' }}>
            <ProductImage 
              imageUrl={item.imageUrl} 
              productId={productId}
              title={item.title}
              purchaseLink={item.purchaseLink}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Contenido a la derecha */}
          <div className="flex-grow min-w-0 flex flex-col justify-center">
            <div className="flex justify-between items-center">
              <div>
                {/* Nombre del producto con mayor tamaño y peso */}
                <h3 className="font-semibold text-lg truncate mr-2 text-white">{item.title}</h3>
                
                <div className="flex items-center mt-1 gap-2">
                  {/* Tag de reservado */}
                  {item.isReserved && (
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                      Reservado
                    </span>
                  )}
                  
                  {/* Precio con mayor tamaño y color blanco */}
                  {item.price && (
                    <span className="text-white font-medium text-base">
                      {item.price}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Botón de opciones */}
              <div className="menu-container self-center">
                <button 
                  onClick={handleShowActions}
                  className="text-white/70 hover:text-white p-1"
                  aria-label="Opciones"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast de acciones que se muestra desde arriba */}
      <ActionToast 
        item={item}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={handleCloseToast}
        show={showActionToast}
      />
    </>
  );
};

export default WishItem;
