import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { X } from 'lucide-react';
import { UseMutationResult, useQueryClient } from "@tanstack/react-query";
import { WishItem } from "@/types";
import { useEffect } from 'react';
import { useInteractionLock } from '@/hooks/use-interaction-lock';
import { CustomSheetContent } from '@/components/CustomSheetContent';

interface UnreserveConfirmationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: WishItem | null;
}

export function UnreserveConfirmationSheet({
  isOpen,
  onClose,
  onConfirm,
  item,
}: UnreserveConfirmationSheetProps) {
  // Accedemos al queryClient para poder refrescar los datos
  const queryClient = useQueryClient();
  
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
    onClose();
    lockInteraction(500); // Bloquear interacciones por 500ms al cerrar
  };

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  if (!item) return null;

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <CustomSheetContent 
        side="bottom" 
        className="px-0 pt-0 pb-6 bg-[#121212] rounded-t-3xl border-t-0"
        onCloseComplete={handleClose}
        // Evento para evitar propagación de clics a través del contenido
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>¿Desmarcar como reservado?</SheetTitle>
          <SheetDescription>
            Al confirmar, este regalo volverá a aparecer como disponible para ser reservado por alguien más.
          </SheetDescription>
        </SheetHeader>
        
        <div className="text-left px-6 pt-6 pb-2 flex items-center justify-between">
          <h3 className="text-white text-xl font-medium">{item.title}</h3>
          <button 
            onClick={handleClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity pl-5 pr-1"
          >
            <X className="h-7 w-7" />
          </button>
        </div>
        
        <div className="px-6 py-4 text-white/90 text-base">
          <p>
            Este deseo fue reservado por alguien para regalártelo, ¿estás seguro de que quieras que vuelva a aparecer como disponible en tu lista de deseos?
          </p>
        </div>

        <div className="px-6 mt-2 flex flex-col gap-2">

          <div className="mt-2 flex flex-col gap-3">
            <button 
              onClick={handleConfirm}
              className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-black rounded-lg text-base font-medium transition-colors flex items-center justify-center"
            >
              Sí, desmarcar como reservado
            </button>
            
            <button 
              onClick={handleClose}
              className="w-full px-4 py-3 border border-[#333] hover:bg-[#252525] text-white/90 rounded-lg text-base transition-colors flex items-center justify-center"
            >
              Cancelar
            </button>
          </div>
        </div>
      </CustomSheetContent>
    </Sheet>
  );
}