import React, { useState, useRef, useEffect } from 'react';
import { WishItem as WishItemType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ProductImage from './ProductImage';
import { MoreVertical, Edit, Trash, ExternalLink } from 'lucide-react';

interface WishItemProps {
  item: WishItemType;
  onEdit: (item: WishItemType) => void;
  onDelete: (item: WishItemType) => void;
  onClick?: (item: WishItemType) => void;
}

const WishItem: React.FC<WishItemProps> = ({ item, onEdit, onDelete, onClick }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
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
  
  // Cerrar el menú cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Función para abrir enlace externamente
  const openExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(item.purchaseLink, '_blank', 'noopener,noreferrer');
  };
  
  // Funciones para editar y eliminar
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit(item);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete(item);
  };

  return (
    <div 
      className="bg-[#1e1e1e] rounded-xl p-4 my-2 relative cursor-pointer hover:bg-[#262626] transition-colors shadow-md"
      onClick={handleItemClick}
    >
      {item.isReserved && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-xl">
          <div className="bg-[#1e1e1e]/90 px-5 py-4 rounded-xl text-center border border-[#333] shadow-lg">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fas fa-check text-primary"></i>
            </div>
            <p className="font-medium text-white text-sm mb-1">¡Alguien ha reservado este regalo!</p>
            <p className="text-white/70 text-xs">Será una sorpresa 🎁</p>
          </div>
        </div>
      )}
      
      <div className="flex">
        {/* Imagen a la izquierda */}
        <div className="w-24 h-24 bg-[#252525] rounded-lg overflow-hidden mr-4 flex-shrink-0 flex items-center justify-center shadow-sm">
          <ProductImage 
            imageUrl={item.imageUrl} 
            productId={productId}
            title={item.title}
            purchaseLink={item.purchaseLink}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Contenido a la derecha */}
        <div className="flex-grow min-w-0 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-base truncate mr-2 text-white">{item.title}</h3>
            
            {/* Menú de 3 puntos */}
            <div className="relative menu-container" ref={menuRef}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className={`text-white/70 hover:text-white p-1 ${item.isReserved ? 'opacity-50 pointer-events-none' : ''}`}
                aria-label="Opciones"
              >
                <MoreVertical size={18} />
              </button>
              
              {showMenu && !item.isReserved && (
                <div className="absolute right-0 top-8 z-10 bg-[#262626] rounded-lg shadow-lg border border-[#333] py-1 w-40">
                  <button 
                    onClick={handleEdit}
                    className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-[#333] flex items-center"
                  >
                    <Edit size={14} className="mr-2" />
                    Editar
                  </button>
                  <button 
                    onClick={openExternalLink}
                    className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-[#333] flex items-center"
                  >
                    <ExternalLink size={14} className="mr-2" />
                    Ver producto
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-[#333] flex items-center"
                  >
                    <Trash size={14} className="mr-2" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Precio */}
          {item.price && (
            <span className="text-primary font-medium text-sm mt-1">
              {item.price}
            </span>
          )}
          
          {/* Descripción solo si existe */}
          {item.description && (
            <p className="text-white/70 text-xs mt-1 line-clamp-2">{item.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishItem;
