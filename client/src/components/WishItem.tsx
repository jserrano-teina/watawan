import React, { useState } from 'react';
import { WishItem as WishItemType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ProductImage from './ProductImage';
import { MoreVertical, X } from 'lucide-react';
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { ItemOptionsSheet } from './modals/ItemOptionsSheet';

interface WishItemProps {
  item: WishItemType;
  onEdit: (item: WishItemType) => void;
  onDelete: (item: WishItemType) => void;
  onClick?: (item: WishItemType) => void;
  onSheetClose?: () => void; // Callback para notificar cuando se cierra el sheet
  onMarkAsReceived?: (itemId: number) => void; // Callback para marcar un item como recibido
}

const WishItem: React.FC<WishItemProps> = ({ item, onEdit, onDelete, onClick, onSheetClose, onMarkAsReceived }) => {
  const [open, setOpen] = useState(false);
  
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
    
    // No abrir el detalle si el sheet está abierto
    if (open) {
      return;
    }
    
    if (onClick) {
      onClick(item);
    }
  };
  
  // Función para abrir enlace externamente
  const openExternalLink = () => {
    window.open(item.purchaseLink, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };
  
  // Funciones para editar y eliminar
  const handleEdit = () => {
    onEdit(item);
    setOpen(false);
  };
  
  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este deseo?')) {
      onDelete(item);
    }
    setOpen(false);
  };

  return (
    <div 
      className="bg-[#1e1e1e] rounded-xl p-4 my-0.5 relative cursor-pointer hover:bg-[#262626] transition-colors shadow-md border border-[#2c2c2c]"
      onClick={handleItemClick}
    >
      <div className="flex items-center">
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
        <div className="flex-grow min-w-0 flex flex-col my-auto">
          <div className="flex justify-between items-center">
            <div>
              {/* Tag de reservado encima del título */}
              {item.isReserved && (
                <span className="px-2 py-0.5 mb-1 bg-green-800/30 text-green-400 text-xs font-medium rounded-full inline-block">
                  Reservado
                </span>
              )}
              
              {/* Nombre del producto con mayor tamaño y peso */}
              <h3 className="font-semibold text-lg truncate mr-2 text-white">{item.title}</h3>
              
              <div className="flex items-center mt-1 gap-2">
                {/* Precio con mayor tamaño y color blanco */}
                {item.price && (
                  <span className="text-white font-medium text-base">
                    {item.price}
                  </span>
                )}
              </div>
            </div>
            
            {/* Menú de opciones con bottom sheet */}
            <Sheet 
              open={open} 
              onOpenChange={(newOpen: boolean) => {
                setOpen(newOpen);
                // Al cerrarse, notificar al componente padre
                if (!newOpen) {
                  // Llamar al callback de cierre si existe
                  if (onSheetClose) {
                    onSheetClose();
                  }
                  
                  // Prevenir cualquier clic en el elemento por un breve periodo
                  const item = document.activeElement as HTMLElement;
                  if (item) {
                    item.blur();
                    
                    // Creamos un div transparente que capture todos los clics por un momento
                    const blocker = document.createElement('div');
                    blocker.style.position = 'fixed';
                    blocker.style.top = '0';
                    blocker.style.left = '0';
                    blocker.style.right = '0';
                    blocker.style.bottom = '0';
                    blocker.style.zIndex = '9999';
                    blocker.style.cursor = 'default';
                    document.body.appendChild(blocker);
                    
                    setTimeout(() => {
                      if (document.body.contains(blocker)) {
                        document.body.removeChild(blocker);
                      }
                    }, 300); // Aumentamos a 300ms para mayor seguridad
                  }
                }
              }}
            >
              <SheetTrigger asChild>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="text-white/70 hover:text-white p-1"
                  aria-label="Opciones"
                >
                  <MoreVertical size={18} />
                </button>
              </SheetTrigger>
              <ItemOptionsSheet
                isOpen={open}
                onOpenChange={setOpen}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                onMarkAsReceived={onMarkAsReceived}
                onExternalLinkClick={(url) => {
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
              />
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishItem;
