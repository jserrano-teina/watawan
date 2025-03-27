import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export type ToastActionElement = React.ReactElement<
  React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
>

// Estado global para gestionar toasts
const globalState = {
  toasts: [] as { id: string, node: React.ReactNode }[],
  listeners: new Set<() => void>()
};

// Funciones para manipular el estado global de toasts
const addToast = (node: React.ReactNode): string => {
  const id = Date.now().toString();
  globalState.toasts.push({ id, node });
  notifyListeners();
  return id;
};

const removeToast = (id: string): void => {
  const index = globalState.toasts.findIndex(t => t.id === id);
  if (index !== -1) {
    globalState.toasts.splice(index, 1);
    notifyListeners();
  }
};

const clearToasts = (): void => {
  globalState.toasts = [];
  notifyListeners();
};

const notifyListeners = (): void => {
  globalState.listeners.forEach(listener => listener());
};

// Hook para usar el sistema de toasts
export const useToastPortal = () => {
  return {
    addToast,
    removeToast,
    clearToasts
  };
};

// Componente para renderizar toasts a través de un portal
const ToastPortal: React.FC = () => {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  
  // Suscribirse a cambios en el estado global
  React.useEffect(() => {
    const listener = () => forceUpdate();
    globalState.listeners.add(listener);
    return () => {
      globalState.listeners.delete(listener);
    };
  }, []);
  
  // Crear el contenedor del portal una vez
  React.useEffect(() => {
    if (!container) {
      const newContainer = document.createElement('div');
      newContainer.className = 'toast-portal';
      document.body.appendChild(newContainer);
      setContainer(newContainer);
      return () => {
        if (document.body.contains(newContainer)) {
          document.body.removeChild(newContainer);
        }
      };
    }
  }, [container]);
  
  if (!container) return null;
  
  // No renderizar nada si no hay toasts
  if (globalState.toasts.length === 0) {
    return createPortal(<></>, container);
  }
  
  return createPortal(
    <div className="fixed bottom-[5rem] left-1/2 transform -translate-x-1/2 flex flex-col p-4 gap-2 w-[90%] max-h-screen z-40">
      {globalState.toasts.map(({id, node}) => (
        <div key={id}>{node}</div>
      ))}
    </div>,
    container
  );
};

// Componente Provider que contiene el portal
const ToastProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <>
      {children}
      <ToastPortal />
    </>
  );
};

// Componente dummy para compatibilidad con el API anterior
const ToastViewport: React.FC = () => null;

const ToastContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        "fixed bottom-[5rem] left-1/2 transform -translate-x-1/2 z-40 w-[90%]",
        className
      )}
      {...props}
    />
  )
};

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info' | 'destructive';
  visible?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Toast: React.FC<ToastProps> = ({ 
  className, 
  variant = 'success', 
  visible = true,
  children, 
  onOpenChange,
  ...props 
}) => {
  const variantClasses = {
    success: "bg-[#152218] text-white border border-green-800/30",
    error: "bg-error text-white",
    warning: "bg-warning text-black",
    info: "bg-secondary text-white",
    destructive: "bg-destructive text-white",
  }

  React.useEffect(() => {
    onOpenChange?.(visible);
  }, [visible, onOpenChange]);

  return (
    <div
      className={cn(
        "px-5 py-3 rounded-lg shadow-lg flex items-center justify-between transition-opacity duration-300",
        variantClasses[variant],
        visible ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
};

const ToastTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        "font-medium text-sm",
        className
      )}
      {...props}
    />
  )
};

const ToastDescription: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        "text-xs opacity-90",
        className
      )}
      {...props}
    />
  )
};

const ToastClose: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ 
  className, 
  ...props 
}) => {
  return (
    <button
      className={cn(
        "ml-2 opacity-70 hover:opacity-100 transition-opacity",
        className
      )}
      {...props}
    >
      <X className="h-4 w-4" />
    </button>
  )
};

export { 
  Toast, 
  ToastContainer, 
  ToastProvider, 
  ToastViewport, 
  ToastTitle, 
  ToastDescription, 
  ToastClose 
}