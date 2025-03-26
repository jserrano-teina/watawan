import * as React from "react"

import { cn } from "@/lib/utils"

export interface CustomTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const CustomTextarea = React.forwardRef<HTMLTextAreaElement, CustomTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "w-full px-4 py-3 bg-[#252525] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
CustomTextarea.displayName = "CustomTextarea"

export { CustomTextarea }