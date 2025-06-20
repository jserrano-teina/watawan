import React, { useState, useEffect } from 'react';
import { WishItem as WishItemType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ProductImage from './ProductImage';
import { MoreVertical, X } from 'lucide-react';
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { ItemOptionsSheet } from './modals/ItemOptionsSheet';
import { useInteractionLock } from '@/hooks/use-interaction-lock';
import { sanitizeInput } from '@/lib/sanitize';

interface WishItemProps {
  item: WishItemType;
  onEdit: (item: WishItemType) => void;
  onDelete: (item: WishItemType) => void;
  onClick?: (item: WishItemType) => void;
  onSheetClose?: () => void; // Callback para notificar cuando se cierra el sheet
  onMarkAsReceived?: (itemId: number) => void; // Callback para marcar un item como recibido
  onUnreserve?: (itemId: number) => void; // Callback para desmarcar un item como reservado
}

const WishItem: React.FC<WishItemProps> = ({ item, onEdit, onDelete, onClick, onSheetClose, onMarkAsReceived, onUnreserve }) => {
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

  // Obtenemos las funciones del sistema de bloqueo global
  const { isInteractionAllowed, lockInteraction } = useInteractionLock();
  
  // Nota: Ya no necesitamos el estado recentlyClosed porque ahora usamos
  // el sistema de bloqueo global para manejar esta funcionalidad
  
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
    
    // Verificar si está permitida la interacción según el sistema global
    if (!isInteractionAllowed()) {
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
      className="bg-[#1e1e1e] rounded-xl p-3 my-0.5 relative cursor-pointer hover:bg-[#262626] transition-colors shadow-md border border-[#2c2c2c] max-w-full overflow-hidden"
      onClick={handleItemClick}
    >
      <div className="flex items-center w-full">
        {/* Imagen a la izquierda con border radius reducido y altura reducida */}
        <div className="w-[72px] h-[72px] bg-[#252525] rounded overflow-hidden mr-3 flex-shrink-0 flex items-center justify-center shadow-sm" style={{ borderRadius: '6px' }}>
          <ProductImage 
            imageUrl={item.imageUrl} 
            productId={productId}
            title={item.title}
            purchaseLink={item.purchaseLink}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Contenido a la derecha */}
        <div className="flex-grow min-w-0 flex flex-col my-auto w-full">
          <div className="flex justify-between items-center w-full">
            <div className="min-w-0 flex-1 pr-3 w-[calc(100%-30px)]">
              {/* Tag de recibido o reservado encima del título */}
              {item.isReceived && (
                <span className="px-2 py-0.5 mb-1 bg-green-800/30 text-green-400 text-xs font-medium rounded-full inline-block">
                  Recibido
                </span>
              )}
              {item.isReserved && !item.isReceived && (
                <span className="px-2 py-0.5 mb-1 bg-[#5883C6]/30 text-[#89AADC] text-xs font-medium rounded-full inline-block">
                  Reservado
                </span>
              )}
              
              {/* Nombre del producto con tamaño reducido */}
              <h3 className="font-semibold text-base truncate text-white overflow-hidden text-ellipsis">{item.title}</h3>
              
              <div className="flex items-center mt-1 gap-2">
                {/* Precio con tamaño reducido */}
                {item.price && (
                  <span className="text-white font-medium text-sm">
                    {item.price}
                  </span>
                )}
              </div>
            </div>
            
            {/* Menú de opciones con bottom sheet */}
            <Sheet 
              open={open} 
              onOpenChange={(newOpen: boolean) => {
                // Al abrirse o cerrarse el Sheet, actualizar el estado local
                setOpen(newOpen);
                
                // Al cerrarse, notificar al componente padre
                if (!newOpen) {
                  // Llamar al callback de cierre si existe
                  if (onSheetClose) {
                    onSheetClose();
                  }
                  
                  // Usar el sistema de bloqueo global en lugar de un sistema personalizado
                  // para prevenir interacciones accidentales después de cerrar el sheet
                  lockInteraction(800); // Bloquear interacciones durante 800ms
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
                onUnreserve={onUnreserve}
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
