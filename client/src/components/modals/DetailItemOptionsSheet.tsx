import React, { useEffect } from "react";
import { 
  Sheet, 
  SheetContent,
} from "@/components/ui/sheet";
import { Edit, Trash2, ExternalLink, Check } from "lucide-react";
import { useInteractionLock } from "@/hooks/use-interaction-lock";
import { WishItem } from "@/types";

interface DetailItemOptionsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: WishItem;
  onEdit: (item: WishItem) => void;
  onDelete: (item: WishItem) => void;
  onMarkAsReceived?: (id: number) => void;
  onExternalLinkClick?: (url: string) => void;
}

export function DetailItemOptionsSheet({
  isOpen,
  onOpenChange,
  item,
  onEdit,
  onDelete,
  onMarkAsReceived,
  onExternalLinkClick
}: DetailItemOptionsSheetProps) {
  // Utilizamos el sistema de bloqueo global para evitar interacciones conflictivas
  const lockInteraction = useInteractionLock(state => state.lockInteraction);
  
  // Cuando este componente se abre, bloqueamos otras interacciones
  useEffect(() => {
    if (isOpen) {
      lockInteraction(500); // Bloquear por 500ms cuando se abre
    }
  }, [isOpen, lockInteraction]);

  // Función para manejar el cierre y bloquear interacciones
  const handleClose = () => {
    onOpenChange(false);
    lockInteraction(300); // Bloquear por 300ms cuando se cierra
  };

  // Manejadores de acciones que cierran el sheet y bloquean interacciones
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(item);
    handleClose();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item);
    handleClose();
  };

  const handleMarkAsReceived = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsReceived) {
      onMarkAsReceived(item.id);
    }
    handleClose();
  };

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onExternalLinkClick && item.purchaseLink) {
      onExternalLinkClick(item.purchaseLink);
    }
    handleClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-[#1E1E1E] rounded-t-xl p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-2 px-4">
          <div className="mx-auto w-12 h-1.5 bg-gray-600 rounded-full mb-4" />
          <h3 className="text-white text-lg font-medium mb-3">{item.title}</h3>
          
          <div className="space-y-0">
            <button
              onClick={handleExternalLink}
              className="w-full py-4 flex items-center text-white hover:bg-[#2A2A2A] rounded-lg px-2"
            >
              <ExternalLink size={20} className="mr-3" />
              <span>Ver en tienda online</span>
            </button>
            
            <button
              onClick={handleEdit}
              disabled={item.isReserved}
              className={`w-full py-4 flex items-center text-white hover:bg-[#2A2A2A] rounded-lg px-2 ${
                item.isReserved ? "opacity-50" : ""
              }`}
            >
              <Edit size={20} className="mr-3" />
              <span>Editar</span>
              {item.isReserved && (
                <span className="ml-auto text-xs bg-[#333] rounded-full px-3 py-1">
                  Bloqueado
                </span>
              )}
            </button>
            
            {item.isReserved && onMarkAsReceived && (
              <button
                onClick={handleMarkAsReceived}
                className="w-full py-4 flex items-center text-green-500 hover:bg-[#2A2A2A] rounded-lg px-2"
              >
                <Check size={20} className="mr-3" />
                <span>Marcar como recibido</span>
              </button>
            )}
            
            <button
              onClick={handleDelete}
              className="w-full py-4 flex items-center text-red-500 hover:bg-[#2A2A2A] rounded-lg px-2"
            >
              <Trash2 size={20} className="mr-3" />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}