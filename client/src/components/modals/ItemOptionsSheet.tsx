import React from 'react';
import { 
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetContent
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
  // Función para hacer un bloqueo de seguridad avanzado
  const createBlocker = (duration: number = 800) => {
    // Creamos un bloqueador externo 
    const blocker = document.createElement('div');
    blocker.style.position = 'fixed';
    blocker.style.top = '0';
    blocker.style.left = '0';
    blocker.style.right = '0';
    blocker.style.bottom = '0';
    blocker.style.zIndex = '10000';
    blocker.style.cursor = 'default'; // Cambiado de 'not-allowed' a 'default'
    blocker.style.backgroundColor = 'transparent'; // Bloqueador invisible
    
    // Escuchar eventos de clic en captura para interceptarlos antes de que lleguen a elementos subyacentes
    const handleEvent = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    
    // Capturar todos los tipos de eventos que podrían causar interacciones
    blocker.addEventListener('click', handleEvent, true);
    blocker.addEventListener('mousedown', handleEvent, true);
    blocker.addEventListener('mouseup', handleEvent, true);
    blocker.addEventListener('touchstart', handleEvent, true);
    blocker.addEventListener('touchend', handleEvent, true);
    
    // Añadir el blocker al DOM
    document.body.appendChild(blocker);
    
    // Eliminar después del tiempo especificado
    setTimeout(() => {
      if (document.body.contains(blocker)) {
        // Eliminar todos los event listeners antes de remover el elemento
        blocker.removeEventListener('click', handleEvent, true);
        blocker.removeEventListener('mousedown', handleEvent, true);
        blocker.removeEventListener('mouseup', handleEvent, true);
        blocker.removeEventListener('touchstart', handleEvent, true);
        blocker.removeEventListener('touchend', handleEvent, true);
        document.body.removeChild(blocker);
      }
    }, duration);
  };
  
  // Función para cerrar con seguridad - cierre básico
  const handleSafeClose = () => {
    // Primero cerramos el sheet
    onOpenChange(false);
    
    // Bloqueador básico
    createBlocker(500);
  };
  
  // Función para cerrar con seguridad extendida - para overlays
  const handleExtendedClose = () => {
    // Primero cerramos el sheet
    onOpenChange(false);
    
    // Bloqueador extendido
    createBlocker(800);
  };
  
  // Métodos para todas las acciones del menú
  const handleEdit = () => {
    onEdit(item);
    handleExtendedClose();
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este deseo?')) {
      onDelete(item);
      handleExtendedClose();
    }
  };
  
  const handleOpenExternalLink = () => {
    if (onExternalLinkClick) {
      onExternalLinkClick(item.purchaseLink);
    } else {
      window.open(item.purchaseLink, '_blank', 'noopener,noreferrer');
    }
    handleExtendedClose();
  };

  const handleMarkAsReceived = () => {
    if (onMarkAsReceived) {
      onMarkAsReceived(item.id);
      handleExtendedClose();
    }
  };

  // Función para manejar el clic en la superposición
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Asegurar que el clic fue en el overlay y no en el contenido
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      handleExtendedClose();
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // Si estamos cerrando, utilizamos la seguridad extendida
          handleExtendedClose();
        } else {
          // Si estamos abriendo, comportamiento normal
          onOpenChange(open);
        }
      }}
    >
      <SheetContent 
        side="bottom" 
        className="px-0 pt-0 pb-6 bg-[#121212] rounded-t-3xl border-t-0"
        // Evento para evitar propagación de clics a través del contenido
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{item.title}</SheetTitle>
          <SheetDescription>Opciones para gestionar este deseo</SheetDescription>
        </SheetHeader>
        <div className="text-left px-6 pt-6 pb-2 flex items-center justify-between">
          <h3 className="text-white text-xl font-medium">{item.title}</h3>
          <button 
            onClick={handleExtendedClose}
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