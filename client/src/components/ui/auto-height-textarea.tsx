import * as React from "react";
import { cn } from "@/lib/utils";

export interface AutoHeightTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minHeight?: number;
}

const AutoHeightTextarea = React.forwardRef<HTMLTextAreaElement, AutoHeightTextareaProps>(
  ({ className, minHeight = 100, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const combinedRef = React.useCallback(
      (element: HTMLTextAreaElement) => {
        textareaRef.current = element;
        if (typeof ref === "function") {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [ref]
    );

    const adjustHeight = React.useCallback(() => {
      const element = textareaRef.current;
      if (!element) return;
      
      // Reset height temporarily to get the correct scrollHeight
      element.style.height = "auto";
      
      // Set to scrollHeight but ensure minimum height
      const newHeight = Math.max(element.scrollHeight, minHeight);
      element.style.height = `${newHeight}px`;
    }, [minHeight]);

    React.useEffect(() => {
      adjustHeight();
      // Also adjust on window resize in case text wrapping changes
      window.addEventListener("resize", adjustHeight);
      return () => window.removeEventListener("resize", adjustHeight);
    }, [adjustHeight]);

    React.useEffect(() => {
      if (props.value !== undefined) {
        adjustHeight();
      }
    }, [props.value, adjustHeight]);

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      if (props.onInput) {
        props.onInput(e);
      }
    };

    return (
      <textarea
        className={cn(
          "w-full px-4 py-3 bg-[#252525] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5883C6] focus:border-transparent text-white resize-none overflow-hidden",
          className
        )}
        ref={combinedRef}
        onInput={handleInput}
        rows={3}
        style={{
          minHeight: `${minHeight}px`,
          height: `${minHeight}px`,
        }}
        {...props}
      />
    );
  }
);

AutoHeightTextarea.displayName = "AutoHeightTextarea";

export { AutoHeightTextarea };