import React, { useState, useEffect } from "react";
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
import { Check, AlertCircle, Pencil, LogOut } from "lucide-react";
import { Toast, ToastContainer } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import BottomNavigation from "@/components/BottomNavigation";
import { useMutation } from "@tanstack/react-query";
import { EditProfileSheet } from "@/components/EditProfileSheet";
import { LogoutSheet } from "@/components/LogoutSheet";

// Función para generar iniciales automáticamente desde el nombre o email
const getInitials = (displayName: string | undefined, email: string) => {
  if (displayName) {
    // Si hay nombre, tomar la primera letra de cada palabra (máximo 2)
    const words = displayName.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    } else {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
  }
  // Si no hay nombre, usar las primeras letras del email
  return email.substring(0, 2).toUpperCase();
}

const ProfilePage = () => {
  const { user, error, isLoading, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [toastState, setToastState] = useState<{ message: string; variant: "success" | "error" } | null>(null);
  const [avatar, setAvatar] = useState<string | undefined>(user?.avatar);
  
  // Efecto para hacer que el toast desaparezca después de 3 segundos
  useEffect(() => {
    if (toastState) {
      const timer = setTimeout(() => {
        setToastState(null);
      }, 3000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [toastState]);
  
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

  const compressImage = (imageDataUrl: string, maxSizeMB = 0.2): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageDataUrl;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calcular el factor de escala para mantener la proporción
        const MAX_SIZE = 500; // px
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Ajustar la calidad para reducir el tamaño
        const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedImage);
      };
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Comprobar tamaño antes de procesar
    if (file.size > 5 * 1024 * 1024) { // 5MB
      setToastState({
        message: "La imagen es demasiado grande. El tamaño máximo es 5MB.",
        variant: "error",
      });
      return;
    }
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const result = reader.result as string;
          // Comprimir imagen antes de guardarla
          const compressedImage = await compressImage(result);
          setAvatar(compressedImage);
          
          updateProfileMutation.mutate({
            displayName: user?.displayName || "",
            avatar: compressedImage,
            initials: ""
          });
        } catch (err) {
          setToastState({
            message: "Error al procesar la imagen. Inténtalo con otra imagen.",
            variant: "error",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setToastState({
        message: "Error al cargar la imagen. Inténtalo con otra imagen.",
        variant: "error",
      });
    }
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
    <div className="min-h-screen pb-20 flex flex-col bg-[#121212] text-white">
      <main className="max-w-[500px] mx-auto p-4 flex-grow flex flex-col justify-center">
        <div className="flex flex-col items-center py-3">
          {/* Avatar con botón de edición */}
          <div className="relative mb-6">
            <div
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center text-xl font-medium",
                avatar ? "overflow-hidden" : "bg-[#252525] text-[#5883C6]"
              )}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={user.displayName || user.email}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(user.displayName, user.email)
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 p-2 rounded-full cursor-pointer shadow-md border border-[#333] bg-[#121212] hover:bg-[#252525] transition-colors"
            >
              <Pencil size={16} className="text-white" />
              <input
                id="avatar-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          {/* Información del usuario */}
          <h2 className="text-xl font-bold mb-1">
            {user.displayName || user.email.split('@')[0]}
          </h2>
          <p className="text-gray-500 text-sm mb-2">{user.email}</p>
          
          {/* Botón de editar */}
          <button
            onClick={() => setIsEditingProfile(true)}
            className="mt-4 px-6 py-3 border border-[#333] rounded-lg text-white font-medium hover:bg-[#252525] transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
            Editar perfil
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setIsLogoutDialogOpen(true)}
            className="text-white flex items-center py-2 px-4 hover:bg-[#252525] transition-colors rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>
        
        {/* Logo y versión (ahora dentro del main pero absoluto) */}
        <div className="absolute bottom-[80px] left-0 right-0 flex flex-col items-center mb-2 pb-4">
          <img 
            src="/images/waw_logo.svg" 
            alt="WataWan" 
            className="h-8 mx-auto mb-1" 
          />
          <span className="text-xs text-gray-500 mb-1">Versión 1.0.0</span>
        </div>
      </main>

      {/* Bottom Sheet para editar perfil */}
      <EditProfileSheet
        user={user}
        isOpen={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
        updateProfileMutation={updateProfileMutation}
        updateEmailMutation={updateEmailMutation}
      />

      {/* Bottom Sheet para cerrar sesión */}
      <LogoutSheet
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        logoutMutation={logoutMutation}
      />

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