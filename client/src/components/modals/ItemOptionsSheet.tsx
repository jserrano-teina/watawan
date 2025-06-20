import React, { useEffect } from 'react';
import { 
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { CustomSheetContent } from '@/components/CustomSheetContent';
import { Check, CheckCheck, Edit, ExternalLink, Trash, Undo, X } from 'lucide-react';
import { WishItem } from '@/types';
import { useInteractionLock } from '@/hooks/use-interaction-lock';
import { SafeLink } from '@/components/ui/SafeLink';
import { sanitizeUrl } from '@/lib/sanitize';

interface ItemOptionsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: WishItem;
  onEdit: (item: WishItem) => void;
  onDelete: (item: WishItem) => void;
  onMarkAsReceived?: (itemId: number) => void;
  onUnreserve?: (itemId: number) => void;
  onExternalLinkClick?: (url: string) => void;
}

export function ItemOptionsSheet({
  isOpen,
  onOpenChange,
  item,
  onEdit,
  onDelete,
  onMarkAsReceived,
  onUnreserve,
  onExternalLinkClick
}: ItemOptionsSheetProps) {
  // Usamos el sistema de bloqueo global para evitar interacciones conflictivas
  const lockInteraction = useInteractionLock(state => state.lockInteraction);
  
  // Cuando este componente se abre, bloqueamos otras interacciones
  useEffect(() => {
    if (isOpen) {
      lockInteraction(500); // Bloquear por 500ms cuando se abre
    }
  }, [isOpen, lockInteraction]);
  
  // Función para cerrar el sheet y aplicar el bloqueo
  const handleClose = () => {
    onOpenChange(false);
    lockInteraction(500); // Bloquear interacciones por 500ms al cerrar
  };
  
  // Métodos para todas las acciones del menú
  const handleEdit = () => {
    onEdit(item);
    handleClose();
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este deseo?')) {
      onDelete(item);
      handleClose();
    }
  };
  
  const handleOpenExternalLink = () => {
    // Sanitizar la URL antes de abrirla
    const safeUrl = sanitizeUrl(item.purchaseLink);
    if (!safeUrl) {
      console.warn('Se intentó abrir una URL no segura:', item.purchaseLink);
      handleClose();
      return;
    }
    
    if (onExternalLinkClick) {
      onExternalLinkClick(safeUrl);
    } else {
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    }
    handleClose();
  };

  const handleMarkAsReceived = () => {
    if (onMarkAsReceived) {
      onMarkAsReceived(item.id);
      handleClose();
    }
  };
  
  const handleUnreserve = () => {
    if (onUnreserve) {
      onUnreserve(item.id);
      handleClose();
    }
  };

  // Función para manejar el clic en la superposición
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Asegurar que el clic fue en el overlay y no en el contenido
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      handleClose();
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // Si estamos cerrando, simplemente notificamos al componente padre
          handleClose();
        } else {
          // Si estamos abriendo, comportamiento normal
          onOpenChange(open);
        }
      }}
    >
      <CustomSheetContent 
        side="bottom" 
        className="px-0 pt-0 pb-6 bg-[#121212] rounded-t-3xl border-t-0"
        onCloseComplete={handleClose}
        // Evento para evitar propagación de clics a través del contenido
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{item.title}</SheetTitle>
          <SheetDescription>Opciones para gestionar este deseo</SheetDescription>
        </SheetHeader>
        <div className="text-left px-6 pt-6 pb-2 flex items-start justify-between">
          <h3 className="text-white text-xl font-medium">{item.title}</h3>
          <button 
            onClick={handleClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity pl-5 pr-1 ml-3 mt-1"
          >
            <X className="h-7 w-7" />
          </button>
        </div>
        
        <div className="mt-4 flex flex-col">
          <button 
            onClick={handleEdit}
            className={`w-full text-left px-6 py-5 text-[17px] text-white/90 hover:bg-[#333] flex items-center ${item.isReserved || item.isReceived ? 'opacity-50 pointer-events-none' : ''}`}
            disabled={item.isReserved || item.isReceived}
          >
            <Edit size={22} className="mr-4" />
            Editar
          </button>
          
          <button 
            onClick={handleOpenExternalLink}
            className="w-full text-left px-6 py-5 text-[17px] text-white/90 hover:bg-[#333] flex items-center"
          >
            <ExternalLink size={22} className="mr-4" />
            Ir al enlace de compra
          </button>
          
          {onUnreserve && item.isReserved && !item.isReceived && (
            <button 
              onClick={handleUnreserve}
              className="w-full text-left px-6 py-5 text-[17px] text-white hover:bg-[#333] flex items-center"
            >
              <Undo size={22} className="mr-4" />
              Desmarcar como reservado
            </button>
          )}
          
          {onMarkAsReceived && !item.isReceived && (
            <button 
              onClick={handleMarkAsReceived}
              className="w-full text-left px-6 py-5 text-[17px] text-green-500 hover:bg-[#333] flex items-center"
            >
              <CheckCheck size={22} className="mr-4" />
              ¡Ya lo recibí!
            </button>
          )}
          
          <button 
            onClick={handleDelete}
            className="w-full text-left px-6 py-5 text-[17px] text-red-400 hover:bg-[#333] flex items-center"
          >
            <Trash size={22} className="mr-4" />
            Eliminar
          </button>
        </div>
      </CustomSheetContent>
    </Sheet>
  );
}