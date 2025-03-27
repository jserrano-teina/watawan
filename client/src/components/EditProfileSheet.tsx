import React, { useState } from "react";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UseMutationResult } from "@tanstack/react-query";
import { X } from "lucide-react";

interface EditProfileSheetProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  updateProfileMutation: UseMutationResult<any, Error, any>;
  updateEmailMutation: UseMutationResult<any, Error, any>;
}

// Componente de input estilizado para mantener consistencia con otros formularios
const CustomInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => {
  return (
    <input
      className={`w-full h-[50px] px-4 rounded-lg bg-[#252525] text-white border-0 focus:ring-2 focus:ring-primary focus:outline-none ${
        error ? "border-red-500 border" : ""
      } ${className}`}
      ref={ref}
      {...props}
    />
  );
});

CustomInput.displayName = "CustomInput";

export function EditProfileSheet({
  user,
  isOpen,
  onClose,
  updateProfileMutation,
  updateEmailMutation,
}: EditProfileSheetProps) {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"name" | "email">("name");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (mode === "name") {
      updateProfileMutation.mutate(
        {
          displayName,
          avatar: user.avatar || "",
          initials: ""
        },
        {
          onSuccess: () => {
            onClose();
          }
        }
      );
    } else {
      if (email === user.email) {
        setError("El nuevo email debe ser diferente al actual");
        return;
      }
      
      if (!password) {
        setError("La contraseña es requerida para cambiar el email");
        return;
      }
      
      updateEmailMutation.mutate(
        { email, password },
        {
          onSuccess: () => {
            onClose();
            setPassword("");
          },
          onError: (err: Error) => {
            setError(err.message || "Error al actualizar el email");
          },
        }
      );
    }
  };

  const handleClose = () => {
    setError("");
    setMode("name");
    setDisplayName(user.displayName || "");
    setEmail(user.email);
    setPassword("");
    onClose();
  };

  const title = mode === "name" ? "Editar perfil" : "Cambiar email";

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent 
        side="bottom" 
        className="px-0 pt-0 pb-6 bg-[#121212] rounded-t-3xl border-t-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {mode === "name" 
              ? "Actualiza tu información personal" 
              : "Para cambiar tu email, necesitamos confirmar tu contraseña"}
          </SheetDescription>
        </SheetHeader>
        
        <div className="text-left px-6 pt-6 pb-2 flex items-center justify-between">
          <h3 className="text-white text-xl font-medium">{title}</h3>
          <button 
            onClick={handleClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity pl-5 pr-1"
          >
            <X className="h-7 w-7" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 mt-4">
          {error && (
            <div className="text-sm text-red-500 font-medium mb-4">{error}</div>
          )}
          
          <div className="text-white/80 mb-6">
            {mode === "name" 
              ? "Actualiza tu nombre de perfil que será visible cuando compartas tus listas de deseos" 
              : "Para cambiar tu email, necesitamos confirmar tu contraseña actual"}
          </div>
          
          {mode === "name" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-white/80">Nombre</Label>
                <CustomInput
                  id="displayName"
                  type="text"
                  placeholder="Tu nombre"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              
              <div className="pt-2">
                <button 
                  type="button" 
                  className="text-primary underline text-sm"
                  onClick={() => setMode("email")}
                >
                  Cambiar email
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">Nuevo email</Label>
                <CustomInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  error={error.includes("email")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">Contraseña actual</Label>
                <CustomInput
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  error={error.includes("contraseña")}
                />
              </div>
              
              <div className="pt-2">
                <button 
                  type="button" 
                  className="text-primary underline text-sm"
                  onClick={() => setMode("name")}
                >
                  Editar perfil
                </button>
              </div>
            </div>
          )}
          
          <div className="flex flex-col pt-8">
            <Button
              type="submit"
              className="w-full h-[50px] rounded-xl font-medium"
              disabled={updateProfileMutation.isPending || updateEmailMutation.isPending}
            >
              {updateProfileMutation.isPending || updateEmailMutation.isPending ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Guardando...
                </div>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}