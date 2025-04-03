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
          ¿Deseas desmarcar este regalo como reservado?
        </div>

        <div className="px-6 mt-2 flex flex-col gap-2">
          <p className="text-sm text-white/60 mb-2">
            Al desmarcar este regalo, volverá a aparecer como disponible para que otra persona pueda reservarlo.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button 
              onClick={handleConfirm}
              className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-base font-medium transition-colors flex items-center justify-center"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-2"
              >
                <rect width="18" height="14" x="3" y="5" rx="2" ry="2"/>
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="3" y1="14" x2="21" y2="14" />
                <line x1="7" y1="19" x2="7" y2="21" />
                <line x1="17" y1="19" x2="17" y2="21" />
                <line x1="9" y1="9" x2="15" y2="9" strokeWidth="2" />
              </svg>
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