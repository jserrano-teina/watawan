import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UseMutationResult, useQueryClient } from "@tanstack/react-query";
import { WishItem } from "@/types";
import { useEffect, useState } from 'react';
import { useInteractionLock } from '@/hooks/use-interaction-lock';
import { CustomSheetContent } from '@/components/CustomSheetContent';

interface ReceivedSuccessSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: WishItem | null;
}

export function ReceivedSuccessSheet({
  isOpen,
  onClose,
  item,
}: ReceivedSuccessSheetProps) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  
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
    // Añadimos un refresco de los datos antes de cerrar
    setRefreshing(true);
    
    // Verificar primero si la hoja está abierta para evitar ejecutar esto varias veces
    if (!isOpen) return;
    
    // Actualizamos todos los queries relevantes para asegurar
    // que la UI se refresca con el estado actualizado
    if (item) {
      // Forzamos el refresco de las listas con fetchQuery para garantizar que los datos se actualizan
      Promise.all([
        queryClient.fetchQuery({ queryKey: [`/api/wishlist/${item.wishlistId}/items`] }),
        queryClient.fetchQuery({ queryKey: ['/api/notifications/unread'] }),
        queryClient.fetchQuery({ queryKey: ['/api/reserved-items'] }),
      ]).finally(() => {
        // Esperamos un poco para asegurar que la UI se actualiza antes de cerrar
        setTimeout(() => {
          setRefreshing(false);
          onClose();
          lockInteraction(1000); // Mayor bloqueo para asegurar que no se realizan otras interacciones
        }, 500); // Mayor retraso para asegurar que la UI se actualiza correctamente
      });
    } else {
      onClose();
      lockInteraction(500);
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
          <SheetTitle>¡Que lo disfrutes!</SheetTitle>
          <SheetDescription>
            Este regalo se ha marcado como recibido y desaparecerá de tu lista de deseos.
          </SheetDescription>
        </SheetHeader>
        
        <div className="p-6 text-center">
          {/* Imagen de celebración */}
          <div className="mx-auto w-64 h-64 mb-6 flex items-center justify-center">
            <img 
              src="/images/received-celebration.png" 
              alt="Celebración" 
              className="w-full h-full object-contain"
            />
          </div>
          
          <h2 className="font-bold text-2xl text-white mb-3">¡Que lo disfrutes!</h2>
          
          {/* Mostrar mensaje de agradecimiento solo si hay reserverName */}
          {item.reserverName && (
            <p className="text-white/80 mb-8">
              No olvides dar las gracias a <span className="font-semibold">{item.reserverName}</span>
            </p>
          )}
          
          <button 
            onClick={handleClose}
            disabled={refreshing}
            className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-black rounded-lg text-base font-medium transition-colors flex items-center justify-center mt-10 relative"
          >
            {refreshing ? (
              <>
                <span className="opacity-0">Cerrar</span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              </>
            ) : (
              "Cerrar"
            )}
          </button>
        </div>
      </CustomSheetContent>
    </Sheet>
  );
}