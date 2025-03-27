import React, { useState } from "react";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { UseMutationResult } from "@tanstack/react-query";

interface EditProfileSheetProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  updateProfileMutation: UseMutationResult<any, Error, any>;
  updateEmailMutation: UseMutationResult<any, Error, any>;
}

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

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl pt-6">
        <SheetHeader className="text-left">
          <SheetTitle>{mode === "name" ? "Editar perfil" : "Cambiar email"}</SheetTitle>
          <SheetDescription>
            {mode === "name" 
              ? "Actualiza tu información personal" 
              : "Para cambiar tu email, necesitamos confirmar tu contraseña"}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-6">
          {error && (
            <div className="text-sm text-red-500 font-medium">{error}</div>
          )}
          
          {mode === "name" ? (
            <div className="space-y-2">
              <Label htmlFor="displayName">Nombre</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Tu nombre"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-[50px]"
              />
              
              <div className="pt-2">
                <Button 
                  type="button" 
                  variant="link" 
                  className="px-0 text-primary underline"
                  onClick={() => setMode("email")}
                >
                  Cambiar email
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Nuevo email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-[50px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña actual</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-[50px]"
                  required
                />
              </div>
              
              <div className="pt-2">
                <Button 
                  type="button" 
                  variant="link" 
                  className="px-0 text-primary underline"
                  onClick={() => setMode("name")}
                >
                  Editar perfil
                </Button>
              </div>
            </div>
          )}
          
          <SheetFooter className="flex flex-col pt-4">
            <Button
              type="submit"
              className="w-full h-[50px]"
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
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}