import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  description?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

/**
 * Componente Toast simple que se puede usar directamente sin depender del sistema de toast global
 */
export const SimpleToast: React.FC<ToastProps> = ({
  message,
  description,
  variant = 'success',
  duration = 3000,
  onClose
}) => {
  const [visible, setVisible] = useState(true);
  
  // Colores según variante
  const variantStyles = {
    success: 'bg-[#152218] text-white border border-green-800/30',
    error: 'bg-red-950 text-white border border-red-800/30',
    warning: 'bg-amber-900 text-amber-50 border border-amber-800/30',
    info: 'bg-slate-800 text-white border border-blue-800/30'
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // Tiempo para la animación de salida
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  return (
    <div
      className={`
        fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[9999]
        px-5 py-3 rounded-lg shadow-lg
        flex items-center justify-between
        transition-opacity duration-300
        ${variantStyles[variant]}
        ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    >
      <div className="grid gap-1">
        <div className="font-medium text-sm">{message}</div>
        {description && <div className="text-xs opacity-90">{description}</div>}
      </div>
      <button 
        onClick={() => {
          setVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        className="ml-3 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Componente para gestionar múltiples toasts
export function useSimpleToast() {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);
  
  const addToast = (props: ToastProps) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...props, id }]);
    return id;
  };
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };
  
  const ToastContainer = () => {
    if (typeof document === 'undefined') return null;
    
    return createPortal(
      <>
        {toasts.map(toast => (
          <SimpleToast
            key={toast.id}
            message={toast.message}
            description={toast.description}
            variant={toast.variant}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </>,
      document.body
    );
  };
  
  return { addToast, removeToast, ToastContainer };
}