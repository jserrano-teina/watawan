import React from 'react';
import * as Dialog from "@radix-ui/react-dialog";
import { sheetVariants } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CustomSheetOverlay } from './CustomSheetOverlay';

interface CustomSheetContentProps {
  side?: "top" | "right" | "bottom" | "left";
  onCloseComplete?: () => void;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

/**
 * Componente personalizado para SheetContent que usa nuestro overlay personalizado
 * y proporciona un callback cuando se completa el cierre.
 */
export function CustomSheetContent({
  side = "right",
  className,
  children,
  onCloseComplete,
  ...props
}: CustomSheetContentProps) {
  return (
    <Dialog.Portal>
      <CustomSheetOverlay onOverlayClick={onCloseComplete || (() => {})} />
      <Dialog.Content
        className={cn(sheetVariants({ side }), className)}
        // No usamos los eventos específicos de Radix UI para evitar problemas de tipado
        // En su lugar, usamos el onOpenChange del componente Sheet
        {...props}
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}