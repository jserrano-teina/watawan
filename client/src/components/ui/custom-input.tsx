import * as React from "react"

import { cn } from "@/lib/utils"

export interface CustomInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
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
CustomInput.displayName = "CustomInput"

export { CustomInput }