import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UseMutationResult } from "@tanstack/react-query";
import { WishItem } from "@/types";
import { useEffect } from 'react';
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
            <p className="text-white/80 mb-16">
              No olvides dar las gracias a <span className="font-semibold">{item.reserverName}</span>
            </p>
          )}
          
          <button 
            onClick={handleClose}
            className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg text-base font-medium transition-colors flex items-center justify-center mt-12"
          >
            Cerrar
          </button>
        </div>
      </CustomSheetContent>
    </Sheet>
  );
}