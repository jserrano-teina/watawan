import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import { Check, AlertCircle } from "lucide-react";
import { Toast, ToastContainer } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import BottomNavigation from "@/components/BottomNavigation";
import { useMutation } from "@tanstack/react-query";

type EditProfileProps = {
  user: User;
  updateProfileMutation: any;
};

const EditProfile = ({ user, updateProfileMutation }: EditProfileProps) => {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [initials, setInitials] = useState(user.initials || "");
  const [avatar, setAvatar] = useState(user.avatar || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      displayName,
      initials,
      avatar,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center text-xl font-medium text-white",
                avatar ? "overflow-hidden" : "bg-primary"
              )}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={displayName || user.email}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials || user.email.substring(0, 2).toUpperCase()
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 bg-secondary hover:bg-secondary/90 p-2 rounded-full cursor-pointer shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <input
                id="avatar-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setAvatar(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="initials">Iniciales</Label>
            <Input
              id="initials"
              type="text"
              placeholder="Tus iniciales"
              value={initials}
              onChange={(e) => setInitials(e.target.value)}
              maxLength={2}
              className="h-[50px]"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-[50px] mt-6"
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
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
        </form>
      </div>
    </div>
  );
};

type EmailFormProps = {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  updateEmailMutation: any;
};

const EmailForm = ({
  user,
  isOpen,
  onClose,
  updateEmailMutation,
}: EmailFormProps) => {
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (email === user.email) {
      setError("El nuevo email debe ser diferente al actual");
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar email</DialogTitle>
          <DialogDescription>
            Para cambiar tu email, necesitamos confirmar tu contraseña
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="text-sm text-red-500 font-medium">{error}</div>
            )}
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              type="button"
              className="h-[50px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-[50px]"
              disabled={updateEmailMutation.isPending}
            >
              {updateEmailMutation.isPending ? (
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
                  Actualizando...
                </div>
              ) : (
                "Cambiar email"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ProfilePage = () => {
  const { user, error, isLoading, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [toastState, setToastState] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  // Mutaciones con TanStack Query
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { displayName: string; initials: string; avatar: string }) => {
      const res = await apiRequest("PUT", "/api/user/profile", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al actualizar el perfil");
      }
      return await res.json();
    },
    onSuccess: () => {
      setToastState({
        message: "Perfil actualizado con éxito",
        variant: "success",
      });
      // Actualizar la información del usuario en la cache
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      setToastState({
        message: error.message || "Error al actualizar el perfil",
        variant: "error",
      });
    }
  });

  const updateEmailMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("PUT", "/api/user/email", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al actualizar el email");
      }
      return await res.json();
    },
    onSuccess: () => {
      setToastState({
        message: "Email actualizado con éxito",
        variant: "success",
      });
      // Actualizar la información del usuario en la cache
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditingEmail(false);
    },
    onError: (error: Error) => {
      setToastState({
        message: error.message || "Error al actualizar el email",
        variant: "error",
      });
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/auth");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Error</h1>
          <p className="text-gray-500">{error?.message || "No se pudo cargar el perfil"}</p>
          <Button
            onClick={() => setLocation("/auth")}
            className="mt-4"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Mi perfil</h1>

        <div className="bg-card rounded-lg p-6 shadow-sm">
          <EditProfile user={user} updateProfileMutation={updateProfileMutation} />
        </div>

        <div className="mt-8 space-y-4">
          <Button
            variant="outline"
            onClick={() => setIsEditingEmail(true)}
            className="w-full h-[50px] border border-gray-300"
          >
            Cambiar email
          </Button>

          <Button
            variant="destructive"
            onClick={() => setIsLogoutDialogOpen(true)}
            className="w-full h-[50px]"
          >
            Cerrar sesión
          </Button>
        </div>
      </div>

      <EmailForm
        user={user}
        isOpen={isEditingEmail}
        onClose={() => setIsEditingEmail(false)}
        updateEmailMutation={updateEmailMutation}
      />

      <AlertDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cerrar la sesión? Tendrás que volver a iniciar sesión para acceder a tus listas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-[50px]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="h-[50px] bg-destructive text-destructive-foreground"
            >
              {logoutMutation.isPending ? (
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
                  Cerrando sesión...
                </div>
              ) : (
                "Cerrar sesión"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />

      {toastState && (
        <ToastContainer>
          <Toast visible={true} variant={toastState.variant}>
            <div className="flex items-center">
              {toastState.variant === 'success' ? (
                <Check className="mr-2 h-6 w-6 text-green-400" />
              ) : (
                <AlertCircle className="mr-2 h-4 w-4" />
              )}
              <span className="text-white font-medium">{toastState.message}</span>
            </div>
          </Toast>
        </ToastContainer>
      )}
    </div>
  );
};

export default ProfilePage;