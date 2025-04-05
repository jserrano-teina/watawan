import React from "react";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose
} from "@/components/ui/sheet";
import { X, LogOut } from "lucide-react";
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
      <SheetContent 
        side="bottom" 
        className="px-0 pt-0 pb-6 bg-[#121212] rounded-t-3xl border-t-0"
      >
        <div className="text-left px-6 pt-6 pb-2 flex items-center justify-between">
          <h3 className="text-white text-xl font-medium">Cerrar sesión</h3>
          <button 
            onClick={onClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity pl-5 pr-1"
          >
            <X className="h-7 w-7" />
          </button>
        </div>

        <div className="px-6 mt-4">
          <p className="text-gray-400 mb-6">
            ¿Quieres cerrar la sesión?
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="bg-[#FFE066] text-black w-full h-[50px] rounded-lg font-medium flex items-center justify-center"
            >
              {logoutMutation.isPending ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
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
                  <LogOut size={16} className="mr-2 text-black" />
                  Cerrar sesión
                </div>
              )}
            </button>
            
            <SheetClose asChild>
              <button 
                className="w-full h-[50px] border border-[#333] rounded-lg text-white hover:bg-[#252525] transition-colors"
              >
                Cancelar
              </button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}