import React from 'react';
import { WishItem as WishItemType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ProductImage from './ProductImage';

interface WishItemProps {
  item: WishItemType;
  onEdit: (item: WishItemType) => void;
  onDelete: (item: WishItemType) => void;
  onClick?: (item: WishItemType) => void;
}

const WishItem: React.FC<WishItemProps> = ({ item, onEdit, onDelete, onClick }) => {
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
      (e.target as HTMLElement).closest('a')
    ) {
      return;
    }
    
    if (onClick) {
      onClick(item);
    }
  };

  return (
    <div 
      className="card-airbnb p-4 my-2 relative cursor-pointer hover:bg-[#202020] transition-colors"
      onClick={handleItemClick}
    >
      {item.isReserved && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-xl">
          <div className="bg-[#1e1e1e]/90 px-5 py-4 rounded-xl text-center border border-[#333] shadow-lg">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fas fa-check text-primary"></i>
            </div>
            <p className="font-medium text-white text-sm mb-1">¡Alguien ha reservado este regalo!</p>
            <p className="text-white/70 text-xs">Será una sorpresa 🎁</p>
          </div>
        </div>
      )}
      
      <div className="flex items-center">
        {/* Imagen a la izquierda */}
        <div className="w-20 h-20 bg-[#252525] rounded-xl overflow-hidden mr-4 flex-shrink-0 flex items-center justify-center shadow-md">
          <ProductImage 
            imageUrl={item.imageUrl} 
            productId={productId}
            title={item.title}
            purchaseLink={item.purchaseLink}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Contenido a la derecha */}
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-base truncate mr-2 text-white">{item.title}</h3>
            <div className={`flex space-x-2 flex-shrink-0 ${item.isReserved ? 'opacity-50 pointer-events-none' : ''}`}>
              <button 
                onClick={() => onEdit(item)} 
                className="text-white/80 hover:text-white p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </button>
              <button 
                onClick={() => onDelete(item)} 
                className="text-white/80 hover:text-primary p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          
          {/* Descripción solo si existe */}
          {item.description && (
            <p className="text-white/70 text-xs mt-1 line-clamp-1">{item.description}</p>
          )}
          
          <div className={`mt-2 flex items-center justify-between text-xs ${item.isReserved ? 'opacity-50 pointer-events-none' : ''}`}>
            <a 
              href={item.purchaseLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 flex items-center font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Ver enlace
            </a>
            <span className="text-white/60 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              {formattedDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishItem;
