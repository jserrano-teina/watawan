import React from 'react';
import { WishItem as WishItemType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ProductImage from './ProductImage';

interface WishItemProps {
  item: WishItemType;
  onEdit: (item: WishItemType) => void;
  onDelete: (item: WishItemType) => void;
}

const WishItem: React.FC<WishItemProps> = ({ item, onEdit, onDelete }) => {
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

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 my-4 relative">
      {item.isReserved && (
        <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white/90 px-6 py-4 rounded-lg text-center">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fas fa-check text-success text-lg"></i>
            </div>
            <p className="font-medium text-neutral-800">¡Alguien ha reservado este regalo!</p>
            <p className="text-neutral-600 text-sm mt-1">Será una sorpresa 🎁</p>
          </div>
        </div>
      )}
      
      <div className="flex md:items-center flex-col md:flex-row">
        <div className="w-full md:w-24 h-24 bg-neutral-100 rounded-lg overflow-hidden mr-0 md:mr-4 mb-4 md:mb-0 flex-shrink-0 flex items-center justify-center">
          <ProductImage 
            imageUrl={item.imageUrl} 
            productId={productId}
            title={item.title}
            purchaseLink={item.purchaseLink}
          />
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-lg">{item.title}</h3>
            <div className={`flex space-x-2 ${item.isReserved ? 'opacity-50 pointer-events-none' : ''}`}>
              <button 
                onClick={() => onEdit(item)} 
                className="text-neutral-500 hover:text-neutral-700"
              >
                <i className="fas fa-edit"></i>
              </button>
              <button 
                onClick={() => onDelete(item)} 
                className="text-neutral-500 hover:text-error"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <p className="text-neutral-600 text-sm mt-1">{item.description}</p>
          <div className={`mt-3 flex flex-col sm:flex-row items-start sm:items-center ${item.isReserved ? 'opacity-50 pointer-events-none' : ''}`}>
            <a 
              href={item.purchaseLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-secondary hover:underline text-sm"
            >
              <i className="fas fa-external-link-alt mr-1"></i>
              Ver enlace de compra
            </a>
            <span className="text-sm text-neutral-500 mt-2 sm:mt-0 sm:ml-4">
              <i className="fas fa-calendar-alt mr-1"></i>
              Añadido: {formattedDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishItem;
