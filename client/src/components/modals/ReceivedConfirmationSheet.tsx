import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Check, X } from 'lucide-react';
import { UseMutationResult } from "@tanstack/react-query";
import { WishItem } from "@/types";
import { useEffect, useState } from 'react';
import { useInteractionLock } from '@/hooks/use-interaction-lock';
import { CustomSheetContent } from '@/components/CustomSheetContent';
import { ReceivedSuccessSheet } from './ReceivedSuccessSheet';

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
  // Estado para controlar la visualización del sheet de éxito
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);
  // Estado para guardar el item marcado como recibido
  const [receivedItem, setReceivedItem] = useState<WishItem | null>(null);
  
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
    // Solo cerramos si no estamos mostrando el sheet de éxito
    if (!showSuccessSheet) {
      onClose();
      lockInteraction(500); // Bloquear interacciones por 500ms al cerrar
    }
  };

  // Función para cerrar el sheet de éxito
  const handleSuccessSheetClose = () => {
    setShowSuccessSheet(false);
    onClose();
    lockInteraction(500);
  };

  const handleConfirm = () => {
    if (item) {
      markAsReceivedMutation.mutate(item.id, {
        onSuccess: (receivedItem) => {
          // Guardamos el item recibido y mostramos el sheet de éxito
          setReceivedItem(receivedItem);
          setShowSuccessSheet(true);
        },
      });
    }
  };

  if (!item) return null;

  return (
    <>
      <Sheet open={isOpen && !showSuccessSheet} onOpenChange={handleClose}>
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
            <h3 className="text-white text-xl font-medium">{item.title}</h3>
            <button 
              onClick={handleClose}
              className="text-white opacity-70 hover:opacity-100 transition-opacity pl-5 pr-1"
            >
              <X className="h-7 w-7" />
            </button>
          </div>
          
          <div className="px-6 py-4 text-white/90 text-base">
            ¿Confirmas que ya has recibido este regalo?
          </div>

          <div className="px-6 mt-2 flex flex-col gap-2">
            {item.description && (
              <p className="text-sm text-white/60 mb-2">{item.description}</p>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <button 
                onClick={handleConfirm}
                disabled={markAsReceivedMutation.isPending}
                className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg text-base font-medium transition-colors flex items-center justify-center"
              >
                <Check size={20} className="mr-2" />
                {markAsReceivedMutation.isPending ? "Confirmando..." : "Sí, ya lo recibí"}
              </button>
              
              <button 
                onClick={handleClose}
                disabled={markAsReceivedMutation.isPending}
                className="w-full px-4 py-3 border border-[#333] hover:bg-[#252525] text-white/90 rounded-lg text-base transition-colors flex items-center justify-center"
              >
                No, aún no
              </button>
            </div>
          </div>
        </CustomSheetContent>
      </Sheet>

      {/* Sheet de éxito después de marcar como recibido */}
      <ReceivedSuccessSheet
        isOpen={showSuccessSheet}
        onClose={handleSuccessSheetClose}
        item={receivedItem || item}
      />
    </>
  );
}