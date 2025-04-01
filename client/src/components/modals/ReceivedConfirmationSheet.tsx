import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Check, X } from 'lucide-react';
import { UseMutationResult } from "@tanstack/react-query";
import { WishItem } from "@/types";
import { useEffect } from 'react';
import { useInteractionLock } from '@/hooks/use-interaction-lock';
import { CustomSheetContent } from '@/components/CustomSheetContent';

interface ReceivedConfirmationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: WishItem | null;
  markAsReceivedMutation: UseMutationResult<WishItem, Error, number>;
}

export function ReceivedConfirmationSheet({
  isOpen,
  onClose,
  item,
  markAsReceivedMutation,
}: ReceivedConfirmationSheetProps) {
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
    if (item) {
      markAsReceivedMutation.mutate(item.id, {
        onSuccess: () => {
          handleClose();
        },
      });
    }
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
          <SheetTitle>¿Ya recibiste este regalo?</SheetTitle>
          <SheetDescription>
            Al confirmar, este regalo se marcará como recibido y desaparecerá de tu lista de deseos.
          </SheetDescription>
        </SheetHeader>
        
        <div className="text-left px-6 pt-6 pb-2 flex items-center justify-between">
          <h3 className="text-white text-xl font-medium">¿Ya recibiste este regalo?</h3>
          <button 
            onClick={handleClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity pl-5 pr-1"
          >
            <X className="h-7 w-7" />
          </button>
        </div>
        
        <div className="px-6 py-3 text-white/80 text-sm">
          Al confirmar, este regalo se marcará como recibido y desaparecerá de tu lista de deseos.
        </div>

        <div className="px-6 mt-2 flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <p className="text-lg font-medium text-white">{item.title}</p>
            {item.description && (
              <p className="text-sm text-white/60">{item.description}</p>
            )}
          </div>

          <div className="mt-6 flex flex-col">
            <button 
              onClick={handleConfirm}
              disabled={markAsReceivedMutation.isPending}
              className="w-full text-left px-6 py-5 text-[17px] text-green-500 hover:bg-[#333] flex items-center justify-center rounded-lg font-medium"
            >
              <Check size={22} className="mr-3" />
              {markAsReceivedMutation.isPending ? "Confirmando..." : "Sí, ya lo recibí"}
            </button>
            
            <button 
              onClick={handleClose}
              disabled={markAsReceivedMutation.isPending}
              className="w-full text-left px-6 py-5 text-[17px] text-white/90 hover:bg-[#333] flex items-center justify-center rounded-lg mt-2"
            >
              No, aún no
            </button>
          </div>
        </div>
      </CustomSheetContent>
    </Sheet>
  );
}