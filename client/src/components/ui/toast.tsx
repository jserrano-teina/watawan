import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

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
        "fixed bottom-20 right-0 flex flex-col p-4 gap-2 w-full md:max-w-[420px] max-h-screen z-40",
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
        "fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50",
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
    success: "bg-success text-white",
    error: "bg-error text-white",
    warning: "bg-warning text-black",
    info: "bg-secondary text-white",
  }

  return (
    <div
      className={cn(
        "px-4 py-2 rounded-lg shadow-lg flex items-center justify-between transition-opacity duration-300",
        variantClasses[variant],
        visible ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
      {...props}
    >
      {children}
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
        "font-medium text-sm",
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
        "text-xs opacity-90",
        className
      )}
      {...props}
    />
  )
}

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
  ToastClose 
}
