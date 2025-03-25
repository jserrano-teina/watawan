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
      className="bg-[#1e1e1e] rounded-xl p-4 my-1 relative cursor-pointer hover:bg-[#262626] transition-colors shadow-md"
      onClick={handleItemClick}
    >
      
      <div className="flex">
        {/* Imagen a la izquierda - border radius reducido */}
        <div className="w-24 h-24 bg-[#252525] rounded-md overflow-hidden mr-4 flex-shrink-0 flex items-center justify-center shadow-sm">
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
            
            {/* Menú de 3 puntos centrado verticalmente */}
            <div className="relative menu-container self-center" ref={menuRef}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="text-white/70 hover:text-white p-1"
                aria-label="Opciones"
              >
                <MoreVertical size={18} />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-8 z-10 bg-[#262626] rounded-lg shadow-lg border border-[#333] py-1 w-40">
                  <button 
                    onClick={handleEdit}
                    className={`w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-[#333] flex items-center ${item.isReserved ? 'opacity-50 pointer-events-none' : ''}`}
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
                    className={`w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-[#333] flex items-center ${item.isReserved ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <Trash size={14} className="mr-2" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishItem;
