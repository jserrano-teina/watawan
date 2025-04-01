import React from 'react';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Check, Edit, ExternalLink, Trash, X } from 'lucide-react';
import { WishItem } from '@/types';

interface ItemOptionsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: WishItem;
  onEdit: (item: WishItem) => void;
  onDelete: (item: WishItem) => void;
  onMarkAsReceived?: (itemId: number) => void;
  onExternalLinkClick?: (url: string) => void;
}

export function ItemOptionsSheet({
  isOpen,
  onOpenChange,
  item,
  onEdit,
  onDelete,
  onMarkAsReceived,
  onExternalLinkClick
}: ItemOptionsSheetProps) {
  // Función para manejar el cierre con seguridad
  const handleSafeClose = () => {
    // Primero cerramos el sheet
    onOpenChange(false);
    
    // Luego bloqueamos clics durante un breve período
    const blocker = document.createElement('div');
    blocker.style.position = 'fixed';
    blocker.style.top = '0';
    blocker.style.left = '0';
    blocker.style.right = '0';
    blocker.style.bottom = '0';
    blocker.style.zIndex = '9999';
    blocker.style.cursor = 'default';
    
    // Escuchar eventos de clic en el blocker para detenerlos por completo
    blocker.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, true);
    
    // Añadir el blocker al DOM
    document.body.appendChild(blocker);
    
    // Eliminar el blocker después de un breve periodo
    setTimeout(() => {
      if (document.body.contains(blocker)) {
        document.body.removeChild(blocker);
      }
    }, 500);
  };
  
  const handleEdit = () => {
    onEdit(item);
    handleSafeClose();
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este deseo?')) {
      onDelete(item);
      handleSafeClose();
    }
  };
  
  const handleOpenExternalLink = () => {
    if (onExternalLinkClick) {
      onExternalLinkClick(item.purchaseLink);
    } else {
      window.open(item.purchaseLink, '_blank', 'noopener,noreferrer');
    }
    handleSafeClose();
  };

  const handleMarkAsReceived = () => {
    if (onMarkAsReceived) {
      onMarkAsReceived(item.id);
      handleSafeClose();
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // Si estamos cerrando, usamos nuestro manejador personalizado
          handleSafeClose();
        } else {
          // Si estamos abriendo, comportamiento normal
          onOpenChange(open);
        }
      }}
    >
      <SheetContent 
        side="bottom" 
        className="px-0 pt-0 pb-6 bg-[#121212] rounded-t-3xl border-t-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{item.title}</SheetTitle>
          <SheetDescription>Opciones para gestionar este deseo</SheetDescription>
        </SheetHeader>
        <div className="text-left px-6 pt-6 pb-2 flex items-center justify-between">
          <h3 className="text-white text-xl font-medium">{item.title}</h3>
          <button 
            onClick={handleSafeClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity pl-5 pr-1"
          >
            <X className="h-7 w-7" />
          </button>
        </div>
        
        <div className="mt-4 flex flex-col">
          <button 
            onClick={handleEdit}
            className={`w-full text-left px-6 py-5 text-[17px] text-white/90 hover:bg-[#333] flex items-center ${item.isReserved ? 'opacity-50 pointer-events-none' : ''}`}
            disabled={item.isReserved}
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
          
          {onMarkAsReceived && (
            <button 
              onClick={handleMarkAsReceived}
              className="w-full text-left px-6 py-5 text-[17px] text-green-500 hover:bg-[#333] flex items-center"
            >
              <Check size={22} className="mr-4" />
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
      </SheetContent>
    </Sheet>
  );
}