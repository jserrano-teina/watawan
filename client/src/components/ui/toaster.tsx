import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToastPortal
} from "@/components/ui/toast"
import { useEffect, useCallback, useState } from "react"

export function Toaster() {
  const { toasts } = useToast();
  const { addToast, removeToast, clearToasts } = useToastPortal();
  const [activeToastIds, setActiveToastIds] = useState<Record<string, boolean>>({});
  
  // Función para crear un elemento toast
  const createToastElement = useCallback((
    { id, title, description, action, ...props }: any
  ) => {
    return (
      <Toast key={id} {...props}>
        <div className="grid gap-1">
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && (
            <ToastDescription>{description}</ToastDescription>
          )}
        </div>
        {action}
        <ToastClose onClick={() => {
          removeToast(id);
          setActiveToastIds(prev => {
            const updated = {...prev};
            delete updated[id];
            return updated;
          });
        }} />
      </Toast>
    );
  }, [removeToast]);
  
  // Limpiar todos los toasts cuando el componente se desmonta
  useEffect(() => {
    return () => {
      clearToasts();
    };
  }, [clearToasts]);
  
  // Añadir/eliminar toasts cuando cambie el estado
  useEffect(() => {
    // Procesar los toasts nuevos
    toasts.forEach(toast => {
      const { id } = toast;
      
      // Si este toast ya está en el portal, no lo añadimos de nuevo
      if (activeToastIds[id]) return;
      
      // Añadir este toast al portal
      const toastElement = createToastElement(toast);
      addToast(toastElement);
      
      // Registrar este toast como activo
      setActiveToastIds(prev => ({...prev, [id]: true}));
      
      // Auto-eliminar después de un tiempo
      setTimeout(() => {
        removeToast(id);
        setActiveToastIds(prev => {
          const updated = {...prev};
          delete updated[id];
          return updated;
        });
      }, 3000); // 3 segundos de duración por defecto
    });
  }, [toasts, addToast, removeToast, createToastElement, activeToastIds]);
  
  // El ToastProvider ya contiene el portal internamente
  return <ToastProvider />;
}