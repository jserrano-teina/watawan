import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CustomInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
  ({ className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const isPasswordField = type === "password"
    
    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword)
    }
    
    return (
      <div className="relative w-full">
        <input
          type={isPasswordField && showPassword ? "text" : type}
          className={cn(
            "w-full h-[50px] px-4 bg-[#252525] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5883C6] focus:border-transparent text-white",
            isPasswordField && "pr-12",
            className
          )}
          ref={ref}
          {...props}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/60 hover:text-white/80"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    )
  }
)
CustomInput.displayName = "CustomInput"

export { CustomInput }