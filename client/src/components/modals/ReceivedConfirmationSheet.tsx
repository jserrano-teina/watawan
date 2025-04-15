import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Check, CheckCheck, X } from 'lucide-react';
import { UseMutationResult, useQueryClient } from "@tanstack/react-query";
import { WishItem } from "@/types";
import { useEffect, useState } from 'react';
import { useInteractionLock } from '@/hooks/use-interaction-lock';
import { CustomSheetContent } from '@/components/CustomSheetContent';
import { ReceivedSuccessSheet } from './ReceivedSuccessSheet';
import { SanitizedHTML } from '@/components/ui/SanitizedHTML';
import { sanitizeInput } from '@/lib/sanitize';

interface ReceivedConfirmationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: WishItem | null;
  markAsReceivedMutation: UseMutationResult<WishItem, Error, number>;
  onItemReceived?: () => void; // Callback para notificar cuando el item se marca como recibido
}

export function ReceivedConfirmationSheet({
  isOpen,
  onClose,
  item,
  markAsReceivedMutation,
  onItemReceived,
}: ReceivedConfirmationSheetProps) {
  // Estado para controlar la visualización del sheet de éxito
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);
  // Estado para guardar el item marcado como recibido
  const [receivedItem, setReceivedItem] = useState<WishItem | null>(null);
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
    // Solo cerramos si no estamos mostrando el sheet de éxito
    if (!showSuccessSheet) {
      // Llamamos a onClose del componente padre para cerrar este sheet,
      // pero no el modal de detalle
      onClose();
      lockInteraction(500); // Bloquear interacciones por 500ms al cerrar
    }
  };

  // Función para cerrar el sheet de éxito
  const handleSuccessSheetClose = () => {
    if (item) {
      // Primero cambiamos el estado de showSuccessSheet
      setShowSuccessSheet(false);
      
      // Forzamos el refresco de los datos antes de cerrar
      Promise.all([
        queryClient.fetchQuery({ queryKey: [`/api/wishlist/${item.wishlistId}/items`] }),
        queryClient.fetchQuery({ queryKey: ['/api/notifications/unread'] }),
        queryClient.fetchQuery({ queryKey: ['/api/reserved-items'] }),
      ]).finally(() => {
        // Esperamos que se completen las solicitudes y luego cerramos
        setTimeout(() => {
          // Cerramos el sheet de confirmación
          onClose();
          
          // Notificamos que el item ha sido marcado como recibido y el proceso ha terminado
          // para que el modal de detalle pueda cerrarse
          if (onItemReceived) {
            onItemReceived();
          }
          
          lockInteraction(1000);
        }, 300);
      });
    } else {
      setShowSuccessSheet(false);
      onClose();
      
      // Notificamos que el item ha sido marcado como recibido y el proceso ha terminado
      if (onItemReceived) {
        onItemReceived();
      }
      
      lockInteraction(500);
    }
  };

  const handleConfirm = () => {
    if (item) {
      markAsReceivedMutation.mutate(item.id, {
        onSuccess: (receivedItem) => {
          // Cerramos el sheet de confirmación inmediatamente
          onClose();
          
          // Guardamos el item recibido y mostramos el sheet de éxito después
          // con un pequeño retraso para permitir que se cierre el anterior
          setTimeout(() => {
            setReceivedItem(receivedItem);
            setShowSuccessSheet(true);
          }, 100);
          
          // No cerramos el modal de detalle aquí, lo haremos al cerrar el sheet de éxito
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
          
          <div className="text-left px-6 pt-6 pb-2 flex items-start justify-between">
            <h3 className="text-white text-xl font-medium">
              {sanitizeInput(item.title)}
            </h3>
            <button 
              onClick={handleClose}
              className="text-white opacity-70 hover:opacity-100 transition-opacity pl-5 pr-1 ml-3 mt-1"
            >
              <X className="h-7 w-7" />
            </button>
          </div>
          
          <div className="px-6 py-4 text-white/90 text-base">
            ¿Confirmas que ya has recibido este regalo?
          </div>

          <div className="px-6 mt-2 flex flex-col gap-2">
            <div className="mt-4 flex flex-col gap-3">
              <button 
                onClick={handleConfirm}
                disabled={markAsReceivedMutation.isPending}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-base font-medium transition-colors flex items-center justify-center"
              >
                <CheckCheck size={20} className="mr-2 text-white" />
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