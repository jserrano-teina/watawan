import * as React from "react"
import { cn } from "@/lib/utils"
import { X, Check, AlertCircle, Info, AlertTriangle } from "lucide-react"

const ToastProvider: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  children 
}) => {
  return <>{children}</>
}

const ToastViewport: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        "fixed bottom-0 right-0 flex flex-col p-4 gap-2 w-full md:max-w-[420px] max-h-screen z-50",
        className
      )}
      {...props}
    />
  )
}

const ToastContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-xl animate-slide-down",
        className
      )}
      {...props}
    />
  )
}

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info';
  visible?: boolean;
}

const Toast: React.FC<ToastProps> = ({ 
  className, 
  variant = 'success', 
  visible = true,
  children, 
  ...props 
}) => {
  const variantClasses = {
    success: "bg-green-800/20 border border-green-800/30 text-white",
    error: "bg-red-800/20 border border-red-800/30 text-white",
    warning: "bg-yellow-800/20 border border-yellow-800/30 text-white",
    info: "bg-blue-800/20 border border-blue-800/30 text-white",
  }

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl shadow-lg flex items-center justify-between transition-opacity duration-300",
        variantClasses[variant],
        visible ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
      {...props}
    >
      <div className="flex items-center flex-1">
        <ToastIcon variant={variant} />
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}

const ToastTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        "font-medium text-sm text-white",
        className
      )}
      {...props}
    />
  )
}

const ToastDescription: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        "text-sm text-white",
        className
      )}
      {...props}
    />
  )
}

const ToastIcon: React.FC<{ variant: ToastProps['variant'] }> = ({ variant }) => {
  const iconMap = {
    success: <Check className="h-5 w-5 text-green-400" />,
    error: <AlertCircle className="h-5 w-5 text-red-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
    info: <Info className="h-5 w-5 text-blue-400" />
  };

  return (
    <div className={cn(
      "w-9 h-9 rounded-full flex items-center justify-center mr-3 flex-shrink-0",
      {
        "bg-green-800/30": variant === 'success',
        "bg-red-800/30": variant === 'error',
        "bg-yellow-800/30": variant === 'warning',
        "bg-blue-800/30": variant === 'info',
      }
    )}>
      {iconMap[variant || 'success']}
    </div>
  );
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
}

export { 
  Toast, 
  ToastContainer, 
  ToastProvider, 
  ToastViewport, 
  ToastTitle, 
  ToastDescription, 
  ToastClose,
  ToastIcon
}
