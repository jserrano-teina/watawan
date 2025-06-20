import React, { useState, useEffect } from "react";
import { validateEmail, getEmailErrorMessage } from "@/lib/validation";
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

// Importamos el CustomInput directamente
import { CustomInput } from "@/components/ui/custom-input";

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
  const [error, setError] = useState("");
  const [emailChanged, setEmailChanged] = useState(false);

  // Comprobar si el email ha cambiado respecto al original
  useEffect(() => {
    setEmailChanged(email !== user.email);
  }, [email, user.email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validar campos manualmente
    if (!displayName.trim()) {
      setError("nombreVacio");
      return;
    }
    
    if (!email.trim()) {
      setError("emailVacio");
      return;
    }
    
    if (!validateEmail(email.trim())) {
      setError("emailInvalido");
      return;
    }
    
    // Si el email ha cambiado, necesitamos validar contraseña
    if (emailChanged) {
      if (!password) {
        setError("passwordVacio");
        return;
      }
      
      updateEmailMutation.mutate(
        { email, password },
        {
          onSuccess: () => {
            // También actualizamos el nombre si ha cambiado
            if (displayName !== user.displayName) {
              updateProfileMutation.mutate({
                displayName,
                avatar: user.avatar || "",
                initials: ""
              });
            }
            onClose();
            setPassword("");
          },
          onError: (err: Error) => {
            setError("passwordIncorrecto");
          },
        }
      );
    } else {
      // Solo se actualiza el nombre
      if (displayName !== user.displayName) {
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
        // No hay cambios que guardar
        onClose();
      }
    }
  };

  const handleClose = () => {
    setError("");
    setDisplayName(user.displayName || "");
    setEmail(user.email);
    setPassword("");
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent 
        side="bottom" 
        className="px-0 pt-0 pb-6 bg-[#121212] rounded-t-3xl border-t-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Editar perfil</SheetTitle>
          <SheetDescription>
            Actualiza tu información personal
          </SheetDescription>
        </SheetHeader>
        
        <div className="text-left px-6 pt-6 pb-2 flex items-start justify-between">
          <h3 className="text-white text-xl font-medium">Editar perfil</h3>
          <button 
            onClick={handleClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity pl-5 pr-1 ml-3 mt-1"
          >
            <X className="h-7 w-7" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 mt-4">
          {error && error !== "nombreVacio" && error !== "emailVacio" && error !== "emailInvalido" && error !== "passwordVacio" && error !== "passwordIncorrecto" && (
            <div className="text-sm text-red-500 font-medium mb-4">{error}</div>
          )}
          
          <div className="space-y-4">
            {/* Campo de nombre */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-white/80">Nombre</Label>
              <CustomInput
                id="displayName"
                type="text"
                placeholder="Tu nombre"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              {error === "nombreVacio" && (
                <p className="text-xs text-red-500 mt-1">
                  El nombre es obligatorio
                </p>
              )}
            </div>
            
            {/* Campo de email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <CustomInput
                id="email"
                type="text"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {(error === "emailVacio" || error === "emailInvalido") && (
                <p className="text-xs text-red-500 mt-1">
                  {error === "emailVacio" ? "Completa este campo" : "Introduce un email válido"}
                </p>
              )}
              <p className="text-xs text-white/60 mt-1">
                Para cambiar tu email deberás confirmar tu contraseña
              </p>
            </div>
            
            {/* Campo de contraseña - deshabilitado si el email no ha cambiado */}
            <div className="space-y-2">
              <Label 
                htmlFor="password" 
                className={`text-white/80 ${!emailChanged ? 'opacity-50' : ''}`}
              >
                Contraseña actual
              </Label>
              <CustomInput
                id="password"
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!emailChanged}
                className={`${!emailChanged ? 'opacity-50' : ''}`}
              />
              {(error === "passwordVacio" || error === "passwordIncorrecto") && (
                <p className="text-xs text-red-500 mt-1">
                  {error === "passwordVacio" ? "La contraseña es obligatoria" : "La contraseña es incorrecta"}
                </p>
              )}
            </div>
          </div>
          
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