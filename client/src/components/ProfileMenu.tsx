import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { LogOut, User, Settings } from 'lucide-react';

interface ProfileMenuProps {
  onClose: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      navigate('/login');
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      ref={menuRef}
      className="absolute right-4 top-16 bg-[#1e1e1e] shadow-xl rounded-xl w-52 z-40 border border-[#333] overflow-hidden"
    >
      <ul className="py-1">
        <li className="px-4 py-3 hover:bg-[#252525] cursor-pointer transition-colors duration-200 text-white">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-3 text-primary/80" />
            <span>Mi perfil</span>
          </div>
        </li>
        <li className="px-4 py-3 hover:bg-[#252525] cursor-pointer transition-colors duration-200 text-white">
          <div className="flex items-center">
            <Settings className="h-4 w-4 mr-3 text-primary/80" />
            <span>Configuración</span>
          </div>
        </li>
        <li 
          onClick={handleLogout}
          className="border-t border-[#333] px-4 py-3 hover:bg-[#252525] cursor-pointer text-primary transition-colors duration-200"
        >
          <div className="flex items-center">
            <LogOut className="h-4 w-4 mr-3" />
            <span>Cerrar sesión</span>
          </div>
        </li>
      </ul>
    </div>
  );
};

export default ProfileMenu;
