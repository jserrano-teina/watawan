import React, { useRef, useEffect } from 'react';
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

interface CustomSheetOverlayProps {
  onOverlayClick: () => void;
  className?: string;
}

/**
 * Overlay personalizado para el componente Sheet con control avanzado de eventos
 * para evitar que los clics se propaguen a los elementos subyacentes.
 */
export function CustomSheetOverlay({ 
  onOverlayClick, 
  className 
}: CustomSheetOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // Capturar eventos de clic en la fase de captura
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleClick = (e: MouseEvent) => {
      // Solo manejamos clics directos en el overlay, no en sus hijos
      if (e.target === overlay) {
        e.preventDefault();
        e.stopPropagation();
        
        // Llamar al callback después de un pequeño retraso
        // para permitir que el sheet se cierre primero
        setTimeout(() => {
          onOverlayClick();
        }, 50);
      }
    };

    overlay.addEventListener('click', handleClick, true);
    
    return () => {
      overlay.removeEventListener('click', handleClick, true);
    };
  }, [onOverlayClick]);

  return (
    <Dialog.Overlay
      ref={overlayRef}
      className={cn(
        "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      // Este onClick es un respaldo, pero nuestro event listener de arriba
      // debería capturar el evento antes
      onClick={(e: React.MouseEvent) => {
        // Detener la propagación para que el clic no llegue a elementos subyacentes
        e.stopPropagation();
      }}
    />
  );
}