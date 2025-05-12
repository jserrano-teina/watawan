import * as React from "react"
import { cn } from "@/lib/utils"

export interface FixedHeightTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  height?: number;  // Altura en píxeles
}

const FixedHeightTextarea = React.forwardRef<HTMLTextAreaElement, FixedHeightTextareaProps>(
  ({ className, height = 100, ...props }, ref) => {
    const heightStyle = `${height}px`;
    
    // Función para manejar la autoexpansión
    const handleInput = React.useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      
      // Primero reseteamos la altura a la fijada
      textarea.style.height = heightStyle;
      
      // Si el contenido sobrepasa la altura fija, expandimos
      const newHeight = Math.max(height, textarea.scrollHeight);
      textarea.style.height = `${newHeight}px`;
    }, [height, heightStyle]);
    
    return (
      <textarea
        className={cn(
          "w-full px-4 py-3 bg-[#252525] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5883C6] focus:border-transparent text-white overflow-hidden",
          className
        )}
        ref={ref}
        style={{ 
          height: heightStyle,
          minHeight: heightStyle,
          resize: "none"
        }}
        onInput={handleInput}
        {...props}
      />
    )
  }
)
FixedHeightTextarea.displayName = "FixedHeightTextarea"

export { FixedHeightTextarea }