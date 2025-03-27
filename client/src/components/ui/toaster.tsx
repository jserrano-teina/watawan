import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastContainer,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      <ToastContainer>
        {toasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast 
              key={id} 
              {...props} 
              visible={props.open}
            >
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
            </Toast>
          )
        })}
      </ToastContainer>
    </ToastProvider>
  )
}
