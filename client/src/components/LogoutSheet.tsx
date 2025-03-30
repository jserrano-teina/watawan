import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";

interface LogoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  logoutMutation: UseMutationResult<void, Error, void>;
}

export function LogoutSheet({ isOpen, onClose, logoutMutation }: LogoutSheetProps) {
  const handleLogout = () => {
    logoutMutation.mutate();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="bg-[#121212] text-white border-l border-[#333]">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl text-white">Cerrar sesión</SheetTitle>
          <SheetDescription className="text-gray-400">
            ¿Estás seguro de que quieres cerrar la sesión? Tendrás que volver a iniciar sesión para acceder a tus listas.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex flex-col gap-4 mt-8">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full h-[50px]"
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
              <div className="flex items-center">
                <LogOut size={16} className="mr-2" />
                Cerrar sesión
              </div>
            )}
          </Button>
          
          <SheetClose asChild>
            <Button 
              variant="outline" 
              className="w-full h-[50px] border-[#333] text-white hover:bg-[#252525] hover:text-white"
            >
              Cancelar
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}